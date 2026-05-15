<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { MerchantBarber, MerchantBarberPayload, MerchantService } from '~/composables/useMerchantApi'

definePageMeta({
  layout: 'merchant'
})

type BarberRow = {
  id: string
  name: string
  phone: string | null
  specialization: string | null
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function toRow(value: MerchantBarber): BarberRow | null {
  const id = normalizeText(value?.id)
  if (!id) return null

  return {
    id,
    is_active: value.is_active ?? null,
    name: normalizeText(value.name) || 'Барбер',
    phone: normalizeText(value.phone),
    specialization: normalizeText(value.specialization)
  }
}

const merchantApi = useMerchantApi()

const createOpen = ref(false)
const editOpen = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  is_active: true,
  name: '',
  phone: '',
  photo_url: '',
  service_names: [] as string[]
})

function parseServiceNames(value: unknown) {
  const text = normalizeText(value)
  if (!text) return []

  return [...new Set(
    text
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  )]
}

function resetForm() {
  form.name = ''
  form.phone = ''
  form.service_names = []
  form.photo_url = ''
  form.is_active = true
}

function openCreate() {
  if (!canCreateBarber.value) {
    useApiClient().notifyError(new Error('services are required'), 'Сначала создайте хотя бы одну услугу.')
    return
  }

  editingId.value = null
  resetForm()
  createOpen.value = true
}

function openEdit(row: BarberRow) {
  editingId.value = row.id
  form.name = row.name || ''
  form.phone = row.phone || ''
  form.service_names = parseServiceNames(row.specialization)
  form.photo_url = ''
  form.is_active = row.is_active !== false
  editOpen.value = true
}

const { data, pending, refresh } = await useAsyncData('merchant-barbers', async () => {
  return await merchantApi.barbers(true)
})

const { data: servicesData, pending: servicesPending, refresh: refreshServices } = await useAsyncData('merchant-barbers-services', async () => {
  return await merchantApi.services(true)
})

const rows = computed<BarberRow[]>(() =>
  ((data.value as any)?.items || []).flatMap((item: MerchantBarber) => {
    const row = toRow(item)
    return row ? [row] : []
  })
)

type ServiceOption = { label: string, value: string }

const serviceOptions = computed<ServiceOption[]>(() =>
  ((servicesData.value as any)?.items || []).flatMap((item: MerchantService) => {
    const name = normalizeText(item?.name)
    if (!name) return []
    return [{ label: name, value: name }]
  })
)

const canCreateBarber = computed(() => serviceOptions.value.length > 0)

async function refreshAll() {
  await Promise.all([refresh(), refreshServices()])
}

const columns: TableColumn<BarberRow>[] = [
  { accessorKey: 'name', header: 'Барбер' },
  { accessorKey: 'phone', header: 'Телефон' },
  { accessorKey: 'specialization', header: 'Специализация' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

async function submitCreate() {
  const name = normalizeText(form.name)
  if (!name) {
    useApiClient().notifyError(new Error('name is required'), 'Введите имя барбера.')
    return
  }

  if (!canCreateBarber.value) {
    useApiClient().notifyError(new Error('services are required'), 'Сначала создайте хотя бы одну услугу.')
    return
  }

  const specialization = form.service_names.length
    ? form.service_names.map(normalizeText).filter(Boolean).join(', ')
    : null

  submitting.value = true
  try {
    const payload: MerchantBarberPayload = {
      branch_id: null,
      is_active: Boolean(form.is_active),
      name,
      phone: normalizeText(form.phone),
      photo_url: normalizeText(form.photo_url),
      specialization
    }

    await merchantApi.createBarber(payload)

    createOpen.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

async function submitEdit() {
  const id = editingId.value
  if (!id) return

  const name = normalizeText(form.name)
  if (!name) {
    useApiClient().notifyError(new Error('name is required'), 'Введите имя барбера.')
    return
  }

  const specialization = form.service_names.length
    ? form.service_names.map(normalizeText).filter(Boolean).join(', ')
    : null

  submitting.value = true
  try {
    await merchantApi.updateBarber(id, {
      is_active: Boolean(form.is_active),
      name,
      phone: normalizeText(form.phone),
      photo_url: normalizeText(form.photo_url),
      specialization
    })

    editOpen.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

async function removeRow(row: BarberRow) {
  if (import.meta.client && !window.confirm(`Удалить барбера «${row.name}»?`)) {
    return
  }

  submitting.value = true
  try {
    await merchantApi.deleteBarber(row.id)
    await refresh()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="merchant-barbers">
    <template #header>
      <UDashboardNavbar title="Барберы" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="pending || servicesPending"
            variant="outline"
            @click="refreshAll()"
          >
            Обновить
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" :disabled="!canCreateBarber" @click="openCreate">
            Добавить барбера
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card">
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div class="space-y-1">
                <h2 class="barbershop-heading text-xl text-charcoal-950">
                  Барберы мерчанта
                </h2>
                <p class="text-sm text-charcoal-500">
                  Здесь показываются только барберы вашего барбершопа (не “главные” барберы системы).
                </p>
                <p v-if="!servicesPending && !canCreateBarber" class="text-sm text-amber-700">
                  Чтобы добавить барбера, сначала создайте хотя бы одну услугу в разделе
                  <NuxtLink to="/merchant/services" class="underline">
                    Услуги
                  </NuxtLink>.
                </p>
              </div>

              <UBadge color="neutral" size="lg" variant="soft">
                {{ rows.length }} шт.
              </UBadge>
            </div>
          </template>

          <div
            v-if="rows.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="columns" :data="rows">
              <template #phone-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.phone || '—' }}
                </span>
              </template>

              <template #specialization-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.specialization || '—' }}
                </span>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  :color="row.original.is_active === false ? 'neutral' : 'success'"
                  size="xs"
                  variant="soft"
                >
                  {{ row.original.is_active === false ? 'Неактивен' : 'Активен' }}
                </UBadge>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEdit(row.original)" />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :loading="submitting"
                    @click="removeRow(row.original)"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <div v-else class="py-10 text-center text-sm text-charcoal-500">
            Барберов пока нет.
          </div>
        </UCard>
      </div>

      <UModal
        v-model:open="createOpen"
        class="sm:max-w-xl"
        title="Новый барбер"
        description="Барбер будет создан только для вашего барбершопа."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Имя" required>
              <UInput v-model="form.name" placeholder="Имя барбера" />
            </UFormField>

            <UFormField label="Телефон">
              <UInput v-model="form.phone" placeholder="+998..." />
            </UFormField>

            <UFormField label="Специализация">
              <USelectMenu
                v-model="form.service_names"
                class="w-full"
                :items="serviceOptions"
                multiple
                placeholder="Выберите услуги"
                value-key="value"
              />
            </UFormField>

            <UFormField label="Фото (URL)">
              <UInput v-model="form.photo_url" placeholder="https://..." />
            </UFormField>

            <UFormField>
              <UCheckbox v-model="form.is_active" label="Активен" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="createOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" :loading="submitting" :disabled="!canCreateBarber" @click="submitCreate">
              Создать
            </UButton>
          </div>
        </template>
      </UModal>

      <UModal
        v-model:open="editOpen"
        class="sm:max-w-xl"
        title="Редактировать барбера"
        description="Изменения применяются только в кабинете мерчанта."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Имя" required>
              <UInput v-model="form.name" placeholder="Имя барбера" />
            </UFormField>

            <UFormField label="Телефон">
              <UInput v-model="form.phone" placeholder="+998..." />
            </UFormField>

            <UFormField label="Специализация">
              <USelectMenu
                v-model="form.service_names"
                class="w-full"
                :items="serviceOptions"
                multiple
                placeholder="Выберите услуги"
                value-key="value"
              />
            </UFormField>

            <UFormField label="Фото (URL)">
              <UInput v-model="form.photo_url" placeholder="https://..." />
            </UFormField>

            <UFormField>
              <UCheckbox v-model="form.is_active" label="Активен" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="editOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" :loading="submitting" @click="submitEdit">
              Сохранить
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
