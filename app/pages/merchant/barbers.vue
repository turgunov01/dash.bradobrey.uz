<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { MerchantBarber, MerchantBarberPayload, MerchantService } from '~/composables/useMerchantApi'
import { formatBranchAttachmentLabel, getBranchBarbershopId } from '~/utils/branchDisplay'
import { resolveApiMediaUrl } from '~/utils/mediaUrl'

const apiClient = useApiClient()
const config = useRuntimeConfig()

definePageMeta({
  layout: 'merchant'
})

type BarberRow = {
  branch_id: string | null
  branch_name: string | null
  id: string
  name: string
  phone: string | null
  photo_url: string | null
  specialization: string | null
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function getPhotoUrl(value: unknown) {
  return resolveApiMediaUrl(value, config.public.apiBase)
}

function toRow(value: MerchantBarber, branchNames = new Map<string, string>()): BarberRow | null {
  const id = normalizeText(value?.id)
  if (!id) return null

  const branchId = normalizeText(value.branch_id)

  return {
    branch_id: branchId,
    branch_name: branchId ? branchNames.get(branchId) || `Филиал ${branchId.slice(0, 8)}` : null,
    id,
    is_active: value.is_active ?? null,
    name: normalizeText(value.name) || 'Барбер',
    phone: normalizeText(value.phone),
    photo_url: normalizeText(value.photo_url),
    specialization: normalizeText(value.specialization)
  }
}

const merchantApi = useMerchantApi()

const createOpen = ref(false)
const editOpen = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  branch_id: '',
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
  form.branch_id = branchOptions.value[0]?.value || ''
  form.name = ''
  form.phone = ''
  form.service_names = []
  form.photo_url = ''
  form.is_active = true
}

function openCreate() {
  if (!canCreateBarber.value) {
    const message = branchOptions.value.length
      ? 'Сначала создайте хотя бы одну услугу.'
      : 'Сначала создайте хотя бы один филиал.'

    apiClient.notifyError(new Error('barber prerequisites are required'), message)
    return
  }

  editingId.value = null
  resetForm()
  createOpen.value = true
}

function openEdit(row: BarberRow) {
  editingId.value = row.id
  form.branch_id = row.branch_id || ''
  form.name = row.name || ''
  form.phone = row.phone || ''
  form.service_names = parseServiceNames(row.specialization)
  form.photo_url = row.photo_url || ''
  form.is_active = row.is_active !== false
  editOpen.value = true
}

const { data, pending, refresh } = await useAsyncData('merchant-barbers', async () => {
  return await merchantApi.barbers(true)
})

const { data: servicesData, pending: servicesPending, refresh: refreshServices } = await useAsyncData('merchant-barbers-services', async () => {
  return await merchantApi.services(true)
})

const { data: branchesData, pending: branchesPending, refresh: refreshBranches } = await useAsyncData('merchant-barbers-branches', async () => {
  return await merchantApi.branches()
})

const { data: merchantBarbershopData, refresh: refreshMerchantBarbershop } = await useAsyncData('merchant-barbers-barbershop', async () => {
  const dashboard = await merchantApi.dashboard()
  const barbershop = await $fetch(`/api/marketplace/catalog/barbershops/${dashboard.barbershop_id}`).catch(() => null)
  const entry = (barbershop as any)?.item ?? (barbershop as any)?.entry ?? barbershop

  return {
    id: normalizeText(dashboard.barbershop_id),
    name: normalizeText((entry as any)?.name)
  }
})

type ServiceOption = { label: string, value: string }
type BranchOption = { label: string, value: string }

const serviceOptions = computed<ServiceOption[]>(() =>
  ((servicesData.value as any)?.items || []).flatMap((item: MerchantService) => {
    const name = normalizeText(item?.name)
    if (!name) return []
    return [{ label: name, value: name }]
  })
)

const merchantBarbershopName = computed(() => normalizeText((merchantBarbershopData.value as any)?.name))

const branchContextNamesById = computed(() => {
  const id = normalizeText((merchantBarbershopData.value as any)?.id)
  const name = merchantBarbershopName.value

  return id && name ? { [id]: name } : {}
})

const branchOptions = computed<BranchOption[]>(() =>
  ((branchesData.value as any)?.items || []).flatMap((item: any) => {
    const id = normalizeText(item?.id)
    if (!id) return []
    const branchContextId = getBranchBarbershopId(item)
    const contextNames = branchContextId && merchantBarbershopName.value && !branchContextNamesById.value[branchContextId]
      ? { ...branchContextNamesById.value, [branchContextId]: merchantBarbershopName.value }
      : branchContextNamesById.value

    return [{
      label: formatBranchAttachmentLabel(item, contextNames, { fallbackContextName: merchantBarbershopName.value }),
      value: id
    }]
  })
)

const branchNameById = computed(() =>
  new Map(branchOptions.value.map(branch => [branch.value, branch.label]))
)

const rows = computed<BarberRow[]>(() =>
  ((data.value as any)?.items || []).flatMap((item: MerchantBarber) => {
    const row = toRow(item, branchNameById.value)
    return row ? [row] : []
  })
)

const canCreateBarber = computed(() => serviceOptions.value.length > 0 && branchOptions.value.length > 0)
const photoPreviewUrl = computed(() => normalizeText(form.photo_url))
const photoPreviewSrc = computed(() => getPhotoUrl(photoPreviewUrl.value))

async function refreshAll() {
  await Promise.all([refresh(), refreshServices(), refreshBranches(), refreshMerchantBarbershop()])
}

const columns: TableColumn<BarberRow>[] = [
  { accessorKey: 'name', header: 'Барбер' },
  { id: 'branch', header: 'Филиал' },
  { accessorKey: 'phone', header: 'Телефон' },
  { accessorKey: 'specialization', header: 'Специализация' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

async function submitCreate() {
  const name = normalizeText(form.name)
  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Введите имя барбера.')
    return
  }

  const branchId = normalizeText(form.branch_id)
  if (!branchId) {
    apiClient.notifyError(new Error('branch_id is required'), 'Выберите филиал для барбера.')
    return
  }

  if (!canCreateBarber.value) {
    const message = branchOptions.value.length
      ? 'Сначала создайте хотя бы одну услугу.'
      : 'Сначала создайте хотя бы один филиал.'

    apiClient.notifyError(new Error('barber prerequisites are required'), message)
    return
  }

  const specialization = form.service_names.length
    ? form.service_names.map(normalizeText).filter(Boolean).join(', ')
    : null

  submitting.value = true
  try {
    const payload: MerchantBarberPayload = {
      branch_id: branchId,
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
    apiClient.notifyError(new Error('name is required'), 'Введите имя барбера.')
    return
  }

  const branchId = normalizeText(form.branch_id)
  if (!branchId) {
    apiClient.notifyError(new Error('branch_id is required'), 'Выберите филиал для барбера.')
    return
  }

  const specialization = form.service_names.length
    ? form.service_names.map(normalizeText).filter(Boolean).join(', ')
    : null

  submitting.value = true
  try {
    await merchantApi.updateBarber(id, {
      branch_id: branchId,
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

const deleteOpen = ref(false)
const deleteHard = ref(false)
const deleteTarget = ref<BarberRow | null>(null)

function removeRow(row: BarberRow) {
  deleteTarget.value = row
  deleteHard.value = false
  deleteOpen.value = true
}

async function confirmDelete() {
  const row = deleteTarget.value
  if (!row) return

  submitting.value = true
  try {
    await merchantApi.deleteBarber(row.id, { hard: deleteHard.value })
    deleteOpen.value = false
    deleteTarget.value = null
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
            :loading="pending || servicesPending || branchesPending"
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
                <p v-if="!servicesPending && !branchesPending && !canCreateBarber" class="text-sm text-amber-700">
                  Чтобы добавить барбера, сначала создайте хотя бы одну услугу и один филиал. Услуги можно добавить в разделе
                  <NuxtLink to="/merchant/services" class="underline">
                    Услуги
                  </NuxtLink>,
                  филиалы — в разделе
                  <NuxtLink to="/merchant/branches" class="underline">
                    Филиалы
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

              <template #branch-cell="{ row }">
                <UBadge
                  v-if="row.original.branch_id"
                  color="neutral"
                  size="xs"
                  variant="soft"
                >
                  {{ row.original.branch_name }}
                </UBadge>
                <span v-else class="text-sm text-amber-700">
                  Не привязан
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

            <UFormField label="Филиал" required>
              <USelectMenu
                v-model="form.branch_id"
                class="w-full"
                :disabled="!branchOptions.length"
                :items="branchOptions"
                placeholder="Выберите филиал"
                value-key="value"
              />
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

            <div class="flex items-center gap-4 rounded-xl border border-charcoal-200 bg-charcoal-50/70 p-3">
              <div class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-charcoal-200 bg-white">
                <img
                  v-if="photoPreviewSrc"
                  :alt="form.name || 'Фото барбера'"
                  :src="photoPreviewSrc"
                  class="size-full object-cover"
                >
                <UIcon v-else class="text-2xl text-charcoal-400" name="i-lucide-user-round" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-charcoal-950">
                  Фото барбера
                </p>
                <p class="break-all text-xs text-charcoal-500">
                  {{ form.photo_url || 'Фото не указано' }}
                </p>
              </div>
            </div>

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

            <UFormField label="Филиал" required>
              <USelectMenu
                v-model="form.branch_id"
                class="w-full"
                :disabled="!branchOptions.length"
                :items="branchOptions"
                placeholder="Выберите филиал"
                value-key="value"
              />
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

            <div class="flex items-center gap-4 rounded-xl border border-charcoal-200 bg-charcoal-50/70 p-3">
              <div class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-charcoal-200 bg-white">
                <img
                  v-if="photoPreviewSrc"
                  :alt="form.name || 'Фото барбера'"
                  :src="photoPreviewSrc"
                  class="size-full object-cover"
                >
                <UIcon v-else class="text-2xl text-charcoal-400" name="i-lucide-user-round" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-charcoal-950">
                  Фото барбера
                </p>
                <p class="break-all text-xs text-charcoal-500">
                  {{ form.photo_url || 'Фото не указано' }}
                </p>
              </div>
            </div>

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
            <UButton color="primary" :loading="submitting" :disabled="!branchOptions.length" @click="submitEdit">
              Сохранить
            </UButton>
          </div>
        </template>
      </UModal>

      <UModal
        v-model:open="deleteOpen"
        class="sm:max-w-md"
        title="Удалить барбера"
        :description="deleteTarget ? `Барбер «${deleteTarget.name}» будет удалён, вход в систему для него перестанет работать.` : ''"
      >
        <template #body>
          <div class="space-y-4">
            <div class="flex items-start gap-3 rounded-xl border p-3" :class="deleteHard ? 'border-error-300 bg-error-50/60' : 'border-charcoal-200 bg-charcoal-50/70'">
              <USwitch v-model="deleteHard" color="error" />
              <div class="min-w-0">
                <p class="text-sm font-semibold text-charcoal-950">
                  Удалить всё безвозвратно
                </p>
                <p class="text-xs text-charcoal-500">
                  {{ deleteHard
                    ? 'Будут удалены визиты барбера в очереди и связанные платежи. Финансовая история изменится. Отменить нельзя.'
                    : 'Статистика и платежи сохранятся (барбер будет отвязан от них). Удалится только сам барбер и его доступы.' }}
                </p>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="deleteOpen = false">
              Отмена
            </UButton>
            <UButton :color="deleteHard ? 'error' : 'primary'" :loading="submitting" @click="confirmDelete">
              {{ deleteHard ? 'Удалить безвозвратно' : 'Удалить' }}
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
