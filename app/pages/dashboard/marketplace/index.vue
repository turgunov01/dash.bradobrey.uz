<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const apiClient = useApiClient()

type BarbershopRow = {
  id: string
  name: string
  city: string | null
  address: string | null
  branches_count: number | null
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function toBarbershopRow(value: unknown): BarbershopRow | null {
  if (!value || typeof value !== 'object') return null
  const anyValue = value as any
  const id = normalizeText(anyValue.id)
  if (!id) return null

  const branchesCountRaw = anyValue.branches_count
  const branchesCount = Number.isFinite(Number(branchesCountRaw)) ? Number(branchesCountRaw) : null

  return {
    address: normalizeText(anyValue.address),
    branches_count: branchesCount,
    city: normalizeText(anyValue.city),
    id,
    is_active: anyValue.is_active === undefined || anyValue.is_active === null ? null : Boolean(anyValue.is_active),
    name: normalizeText(anyValue.name) || 'Барбершоп'
  }
}

const route = useRoute()
const router = useRouter()
const store = useDashboardMarketplaceStore()
const marketplaceBarbershopsApi = useMarketplaceBarbershopsApi()

const city = ref(typeof route.query.city === 'string' ? route.query.city : '')
const status = ref<'active' | 'inactive' | 'all'>(
  route.query.status === 'inactive' || route.query.status === 'all' ? route.query.status : 'active'
)

const createModalOpen = ref(false)
const submitting = ref(false)
const deletingBarbershopId = ref('')

const createForm = reactive({
  address: '',
  city: '',
  cover_url: '',
  description: '',
  is_active: true,
  logo_url: '',
  name: '',
  sort_order: 0,
  timezone: 'Asia/Tashkent'
})

const days = [
  { key: 'mon', label: 'Пн' },
  { key: 'tue', label: 'Вт' },
  { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' },
  { key: 'fri', label: 'Пт' },
  { key: 'sat', label: 'Сб' },
  { key: 'sun', label: 'Вс' }
] as const

type DayKey = typeof days[number]['key']

const defaultWorkHours: Record<DayKey, { start_time: string, end_time: string }> = {
  mon: { end_time: '20:00', start_time: '10:00' },
  tue: { end_time: '20:00', start_time: '10:00' },
  wed: { end_time: '20:00', start_time: '10:00' },
  thu: { end_time: '20:00', start_time: '10:00' },
  fri: { end_time: '20:00', start_time: '10:00' },
  sat: { end_time: '20:00', start_time: '10:00' },
  sun: { end_time: '20:00', start_time: '10:00' }
}

const workHours = reactive<Record<DayKey, { start_time: string, end_time: string }>>({
  ...defaultWorkHours
})
const { pending, refresh } = await useAsyncData('dashboard-marketplace-catalog', async () => {
  await store.fetchBarbershops({
    city: city.value || undefined,
    status: status.value
  })

  return true
})

const rows = computed<BarbershopRow[]>(() =>
  (store.barbershops || []).flatMap(item => {
    const row = toBarbershopRow(item)
    return row ? [row] : []
  })
)

const columns: TableColumn<BarbershopRow>[] = [
  { accessorKey: 'name', header: 'Барбершоп' },
  { accessorKey: 'city', header: 'Город' },
  { accessorKey: 'branches_count', header: 'Филиалы' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

async function applyFilters() {
  await router.replace({
    query: {
      ...route.query,
      ...(city.value ? { city: city.value } : { city: undefined }),
      status: status.value
    }
  })

  await refresh()
}

function resetWorkHours() {
  for (const day of days) {
    workHours[day.key].start_time = defaultWorkHours[day.key].start_time
    workHours[day.key].end_time = defaultWorkHours[day.key].end_time
  }
}

function resetCreateForm() {
  createForm.name = ''
  createForm.city = city.value || ''
  createForm.address = ''
  createForm.timezone = 'Asia/Tashkent'
  createForm.description = ''
  createForm.logo_url = ''
  createForm.cover_url = ''
  createForm.sort_order = 0
  createForm.is_active = true
  resetWorkHours()
}

function openCreateModal() {
  resetCreateForm()
  createModalOpen.value = true
}

async function submitCreate() {
  const name = normalizeText(createForm.name)

  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Укажите название барбершопа.')
    return
  }

  submitting.value = true
  try {
    await marketplaceBarbershopsApi.create({
      address: normalizeText(createForm.address),
      city: normalizeText(createForm.city),
      cover_url: normalizeText(createForm.cover_url),
      description: normalizeText(createForm.description),
      is_active: Boolean(createForm.is_active),
      logo_url: normalizeText(createForm.logo_url),
      name,
      sort_order: Number(createForm.sort_order || 0),
      timezone: normalizeText(createForm.timezone),
      work_hours: JSON.parse(JSON.stringify(workHours))
    })

    createModalOpen.value = false
    await refresh()
  } finally {
    submitting.value = false
  }
}

async function deleteBarbershop(row: BarbershopRow) {
  const label = row.name ? `«${row.name}»` : row.id

  if (import.meta.client && !window.confirm(`Удалить барбершоп ${label}? Филиалы и пользователи будут отвязаны от него, а услуги и мастера маркетплейса будут удалены.`)) {
    return
  }

  deletingBarbershopId.value = row.id
  try {
    await marketplaceBarbershopsApi.remove(row.id)
    await refresh()
  }
  finally {
    deletingBarbershopId.value = ''
  }
}
</script>

<template>
  <UDashboardPanel id="marketplace">
    <template #header>
      <UDashboardNavbar title="Маркетплейс" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" @click="openCreateModal">
            Добавить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="space-y-1">
                <h2 class="barbershop-heading text-xl text-charcoal-950">
                  Барбершопы
                </h2>
                <p class="text-sm text-charcoal-500">
                  Управление каталогом маркетплейса: добавление и просмотр барбершопов.
                </p>
              </div>

              <div class="flex flex-wrap items-center justify-end gap-3">
                <UInput v-model="city" placeholder="Город (например, Ташкент)" class="w-full sm:w-60" />

                <USelect
                  v-model="status"
                  class="w-full sm:w-52"
                  :items="[
                    { label: 'Только активные', value: 'active' },
                    { label: 'Только неактивные', value: 'inactive' },
                    { label: 'Все', value: 'all' }
                  ]"
                />

                <UButton color="primary" icon="i-lucide-search" @click="applyFilters">
                  Показать
                </UButton>

                <UBadge color="neutral" size="lg" variant="soft">
                  {{ rows.length }} шт.
                </UBadge>
              </div>
            </div>
          </template>

          <div
            v-if="rows.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="columns" :data="rows">
              <template #name-cell="{ row }">
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-medium text-charcoal-950">{{ row.original.name }}</span>
                    <UBadge
                      v-if="row.original.is_active !== null"
                      :color="row.original.is_active === false ? 'neutral' : 'success'"
                      size="xs"
                      variant="soft"
                    >
                      {{ row.original.is_active === false ? 'Неактивен' : 'Активен' }}
                    </UBadge>
                  </div>
                  <p class="text-xs text-charcoal-500">
                    {{ row.original.id }}
                  </p>
                </div>
              </template>

              <template #city-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.city || '—' }}
                </span>
              </template>

              <template #branches_count-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.branches_count ?? '—' }}
                </span>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  v-if="row.original.is_active !== null"
                  :color="row.original.is_active === false ? 'neutral' : 'success'"
                  variant="soft"
                >
                  {{ row.original.is_active === false ? 'Неактивен' : 'Активен' }}
                </UBadge>
                <span v-else class="text-sm text-charcoal-500">—</span>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    icon="i-lucide-eye"
                    variant="ghost"
                    size="xs"
                    :to="`/dashboard/marketplace/barbershops/${row.original.id}`"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :loading="deletingBarbershopId === row.original.id"
                    @click="deleteBarbershop(row.original)"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <SharedEmptyState
            v-else-if="!pending"
            title="Пусто"
            description="Барбершопы не найдены или не удалось загрузить каталог."
            icon="i-lucide-store"
          />

          <div v-else class="flex justify-center py-8">
            <ULoader size="lg" />
          </div>
        </UCard>
      </div>

      <UModal
        v-model:open="createModalOpen"
        class="sm:max-w-2xl"
        title="Добавить барбершоп"
        description="Создаёт новый барбершоп в каталоге маркетплейса. Без бронирований и оплат."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="createForm.name" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Город">
                <UInput v-model="createForm.city" placeholder="Ташкент" />
              </UFormField>

              <UFormField label="Timezone">
                <UInput v-model="createForm.timezone" placeholder="Asia/Tashkent" />
              </UFormField>
            </div>

            <UFormField label="Адрес">
              <UInput v-model="createForm.address" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Лого URL">
                <UInput v-model="createForm.logo_url" placeholder="https://..." />
              </UFormField>

              <UFormField label="Обложка URL">
                <UInput v-model="createForm.cover_url" placeholder="https://..." />
              </UFormField>
            </div>

            <UFormField label="Описание">
              <UTextarea v-model="createForm.description" :rows="3" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Сортировка">
                <UInput v-model.number="createForm.sort_order" type="number" />
              </UFormField>

              <div class="flex items-end">
                <UCheckbox v-model="createForm.is_active" label="Активен в маркетплейсе" />
              </div>
            </div>

            <UCard class="rounded-2xl border border-charcoal-200 bg-white/70">
              <template #header>
                <div class="flex items-center justify-between gap-3">
                  <div class="space-y-1">
                    <h4 class="font-semibold text-charcoal-950">
                      Время работы
                    </h4>
                    <p class="text-sm text-charcoal-500">
                      Сохраняется в <span class="font-mono">work_hours</span> (используются инпуты времени).
                    </p>
                  </div>
                </div>
              </template>

              <div class="grid gap-3 sm:grid-cols-2">
                <div
                  v-for="day in days"
                  :key="day.key"
                  class="rounded-2xl border border-charcoal-200 bg-white/80 p-4"
                >
                  <p class="text-sm font-medium text-charcoal-950">
                    {{ day.label }}
                  </p>

                  <div class="mt-3 grid grid-cols-2 gap-3">
                    <UFormField label="Начало">
                      <UInput v-model="workHours[day.key].start_time" type="time" />
                    </UFormField>
                    <UFormField label="Конец">
                      <UInput v-model="workHours[day.key].end_time" type="time" />
                    </UFormField>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex w-full flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="outline" :disabled="submitting" @click="resetCreateForm">
              Сбросить
            </UButton>
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="close">
              Закрыть
            </UButton>
            <UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submitCreate">
              Создать
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
