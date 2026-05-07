<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

type ActiveFilter = 'all' | 'active'

const marketplaceApi = useMarketplaceApi()

const activeFilter = ref<ActiveFilter>('all')
const searchQuery = ref('')

const filterItems = [
  { label: 'Все', value: 'all' as const },
  { label: 'Активные', value: 'active' as const }
]

const barbershopModalOpen = ref(false)
const submitPending = ref(false)

const fieldErrors = reactive({
  name: '',
  work_hours: ''
})

const form = reactive({
  address: '',
  city: '',
  id: '',
  is_active: true,
  name: '',
  timezone: 'Asia/Tashkent',
  work_hours: ''
})

const workHoursTemplate = `{
  \"monday\": [{ \"start\": \"09:00\", \"end\": \"20:00\" }],
  \"tuesday\": [{ \"start\": \"09:00\", \"end\": \"20:00\" }],
  \"wednesday\": [{ \"start\": \"09:00\", \"end\": \"20:00\" }],
  \"thursday\": [{ \"start\": \"09:00\", \"end\": \"20:00\" }],
  \"friday\": [{ \"start\": \"09:00\", \"end\": \"20:00\" }],
  \"saturday\": [{ \"start\": \"10:00\", \"end\": \"18:00\" }],
  \"sunday\": []
}`

function extractItems(response: unknown): any[] {
  if (Array.isArray(response)) {
    return response
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as any

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.entry)) {
    return payload.entry
  }

  if (payload.payload && typeof payload.payload === 'object') {
    const inner = payload.payload

    if (Array.isArray(inner.data)) {
      return inner.data
    }

    if (Array.isArray(inner.items)) {
      return inner.items
    }
  }

  return []
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function normalizeWorkHours(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) return ''

    try {
      return JSON.stringify(JSON.parse(text), null, 2)
    }
    catch {
      return text
    }
  }

  try {
    return JSON.stringify(value, null, 2)
  }
  catch {
    return ''
  }
}

const columns: TableColumn<any>[] = [
  { accessorKey: 'name', header: 'name' },
  { accessorKey: 'city', header: 'city' },
  { accessorKey: 'address', header: 'address' },
  { accessorKey: 'timezone', header: 'timezone' },
  { accessorKey: 'is_active', header: 'is_active' },
  { id: 'actions', header: 'Действия' }
]

const { data, pending, refresh } = await useAsyncData('admin-marketplace-barbershops', async () => {
  const active = activeFilter.value === 'active' ? true : null
  const response = await marketplaceApi.barbershops.list({ active })
  return extractItems(response)
}, {
  server: false,
  watch: [() => activeFilter.value]
})

const rows = computed(() => {
  const raw = Array.isArray(data.value) ? data.value : []

  return raw.map((item, index) => ({
    address: normalizeText(item?.address) || '—',
    city: normalizeText(item?.city) || '—',
    id: String(item?.id ?? item?._id ?? `barbershop-${index}`),
    is_active: Boolean(item?.is_active ?? item?.active ?? false),
    name: normalizeText(item?.name) || 'Барбершоп без названия',
    timezone: normalizeText(item?.timezone) || '—',
    raw: item
  }))
})

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return rows.value
  }

  return rows.value.filter((row) => row.name.toLowerCase().includes(query))
})

watch(barbershopModalOpen, (open) => {
  if (!open) {
    resetForm()
  }
})

const modalTitle = computed(() => (form.id ? 'Редактировать барбершоп' : 'Добавить барбершоп'))
const modalDescription = computed(() =>
  form.id
    ? 'Измените поля и сохраните.'
    : 'Заполните форму, чтобы добавить новый барбершоп.'
)

function resetFieldErrors() {
  fieldErrors.name = ''
  fieldErrors.work_hours = ''
}

function resetForm() {
  resetFieldErrors()
  form.address = ''
  form.city = ''
  form.id = ''
  form.is_active = true
  form.name = ''
  form.timezone = 'Asia/Tashkent'
  form.work_hours = ''
}

function openCreateModal() {
  resetForm()
  barbershopModalOpen.value = true
}

function editBarbershop(row: any) {
  const item = row?.raw ?? row
  resetForm()

  form.address = normalizeText(item?.address)
  form.city = normalizeText(item?.city)
  form.id = normalizeText(item?.id ?? item?._id)
  form.is_active = Boolean(item?.is_active ?? item?.active ?? true)
  form.name = normalizeText(item?.name)
  form.timezone = normalizeText(item?.timezone) || 'Asia/Tashkent'
  form.work_hours = normalizeWorkHours(item?.work_hours ?? item?.workHours)

  barbershopModalOpen.value = true
}

function insertWorkHoursTemplate() {
  form.work_hours = workHoursTemplate
}

function validateForm() {
  resetFieldErrors()

  if (!form.name.trim()) {
    fieldErrors.name = 'Название обязательно'
  }

  if (form.work_hours.trim()) {
    try {
      JSON.parse(form.work_hours)
    }
    catch {
      fieldErrors.work_hours = 'Невалидный JSON'
    }
  }

  return !fieldErrors.name && !fieldErrors.work_hours
}

async function submitBarbershop() {
  if (!validateForm()) {
    useApiClient().notifyError(new Error(fieldErrors.name || fieldErrors.work_hours || 'Проверьте форму'))
    return
  }

  const workHours = form.work_hours.trim()
    ? JSON.parse(form.work_hours)
    : undefined

  const payload = {
    address: form.address.trim() || null,
    city: form.city.trim() || null,
    is_active: Boolean(form.is_active),
    name: form.name.trim(),
    timezone: form.timezone.trim() || null,
    ...(workHours !== undefined ? { work_hours: workHours } : {})
  }

  submitPending.value = true

  try {
    if (form.id) {
      await marketplaceApi.barbershops.update(form.id, payload)
    }
    else {
      await marketplaceApi.barbershops.create(payload)
    }

    barbershopModalOpen.value = false
    await refresh()
  }
  finally {
    submitPending.value = false
  }
}

async function toggleActive(row: any) {
  const item = row?.raw ?? row
  const id = normalizeText(item?.id ?? item?._id)

  if (!id) return

  if (Boolean(item?.is_active ?? item?.active ?? false)) {
    await marketplaceApi.barbershops.deactivate(id)
  }
  else {
    await marketplaceApi.barbershops.activate(id)
  }

  await refresh()
}
</script>

<template>
  <div class="grid gap-6">
    <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
      <template #header>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
              Каталог
            </p>
            <h3 class="barbershop-heading text-2xl text-charcoal-950">
              Барбершопы
            </h3>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Поиск по name"
              class="w-full sm:w-64"
            />

            <USelectMenu
              v-model="activeFilter"
              :items="filterItems"
              value-key="value"
              class="w-full sm:w-44"
            />

            <UButton color="primary" icon="i-lucide-plus" @click="openCreateModal">
              Добавить барбершоп
            </UButton>
          </div>
        </div>
      </template>

      <div v-if="filteredRows.length" class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
        <div class="max-h-[78vh] overflow-auto">
          <UTable
            :columns="columns"
            :data="filteredRows"
            :loading="pending"
            :ui="{
              root: 'w-full overflow-auto',
              base: 'w-full min-w-[62rem]',
              thead: 'bg-charcoal-50/90',
              tbody: 'divide-y divide-charcoal-100',
              th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
              td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
            }"
            sticky="header"
          >
            <template #name-cell="{ row }">
              <div class="space-y-1">
                <p class="font-semibold text-charcoal-950">
                  {{ row.original.name }}
                </p>
                <p class="text-xs text-charcoal-500">
                  {{ row.original.city !== '—' ? row.original.city : 'Город не указан' }}
                </p>
              </div>
            </template>

            <template #is_active-cell="{ row }">
              <SharedStatusBadge :label="row.original.is_active ? 'active' : 'inactive'" />
            </template>

            <template #actions-cell="{ row }">
              <div class="flex flex-wrap gap-2">
                <UButton color="neutral" size="xs" variant="outline" @click="editBarbershop(row.original)">
                  Редактировать
                </UButton>
                <UButton color="neutral" size="xs" variant="outline" @click="toggleActive(row.original)">
                  {{ row.original.is_active ? 'Деактивировать' : 'Активировать' }}
                </UButton>
              </div>
            </template>
          </UTable>
        </div>
      </div>

      <SharedEmptyState
        v-else
        description="Эндпоинт /api/marketplace/barbershops не вернул ни одной записи."
        icon="i-lucide-store"
        title="Барбершопов нет"
      />
    </UCard>

    <UModal
      v-model:open="barbershopModalOpen"
      class="sm:max-w-2xl"
      :description="modalDescription"
      :title="modalTitle"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="name" required :error="fieldErrors.name">
            <UInput v-model="form.name" placeholder="Например: BRADO" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="city">
              <UInput v-model="form.city" placeholder="Tashkent" />
            </UFormField>
            <UFormField label="timezone">
              <UInput v-model="form.timezone" placeholder="Asia/Tashkent" />
            </UFormField>
          </div>

          <UFormField label="address">
            <UInput v-model="form.address" placeholder="Улица, дом" />
          </UFormField>

          <UFormField label="work_hours (JSON)" :error="fieldErrors.work_hours">
            <div class="space-y-2">
              <div class="flex justify-end">
                <UButton color="neutral" size="xs" variant="outline" @click="insertWorkHoursTemplate">
                  Вставить шаблон
                </UButton>
              </div>
              <UTextarea
                v-model="form.work_hours"
                :rows="10"
                :placeholder="workHoursTemplate"
                class="font-mono"
              />
            </div>
          </UFormField>

          <div class="flex items-center">
            <UCheckbox v-model="form.is_active" label="Активен" />
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex w-full flex-wrap justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="resetForm">
            Сбросить
          </UButton>
          <UButton color="neutral" variant="ghost" @click="close">
            Закрыть
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-save"
            :loading="submitPending"
            @click="submitBarbershop"
          >
            {{ form.id ? 'Сохранить' : 'Создать' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

