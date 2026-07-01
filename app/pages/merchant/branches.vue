<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const apiClient = useApiClient()

type BranchRow = {
  id: string
  name: string
  address: string | null
  city: string | null
  timezone: string | null
  work_hours: any | null
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function getExternalAddressUrl(value: string | null) {
  const address = normalizeText(value)

  if (!address || !/^https?:\/\//i.test(address)) {
    return null
  }

  return address
}

function toBranchRow(value: unknown): BranchRow | null {
  if (!value || typeof value !== 'object') return null
  const anyValue = value as any
  const id = normalizeText(anyValue.id)
  if (!id) return null

  return {
    address: normalizeText(anyValue.address),
    city: normalizeText(anyValue.city),
    id,
    is_active: anyValue.is_active === undefined || anyValue.is_active === null ? null : Boolean(anyValue.is_active),
    name: normalizeText(anyValue.name) || 'Филиал',
    timezone: normalizeText(anyValue.timezone),
    work_hours: anyValue.work_hours ?? null
  }
}

definePageMeta({
  layout: 'merchant'
})

const merchantApi = useMerchantApi()

const createModalOpen = ref(false)
const editModalOpen = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)

const branchForm = reactive({
  address: '',
  city: '',
  is_active: true,
  name: '',
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

function cloneWorkHours(source: Record<DayKey, { start_time: string, end_time: string }>) {
  return days.reduce((acc, day) => {
    acc[day.key] = { ...source[day.key] }
    return acc
  }, {} as Record<DayKey, { start_time: string, end_time: string }>)
}

const workHours = reactive<Record<DayKey, { start_time: string, end_time: string }>>(
  cloneWorkHours(defaultWorkHours)
)

function applyWorkHours(value: unknown) {
  resetWorkHours()

  if (!value || typeof value !== 'object') return
  const anyValue = value as any

  for (const day of days) {
    const entry = anyValue[day.key]
    if (!entry || typeof entry !== 'object') continue

    const start = normalizeText((entry as any).start_time)
    const end = normalizeText((entry as any).end_time)

    if (start) workHours[day.key].start_time = start
    if (end) workHours[day.key].end_time = end
  }
}

function resetWorkHours() {
  for (const day of days) {
    workHours[day.key].start_time = defaultWorkHours[day.key].start_time
    workHours[day.key].end_time = defaultWorkHours[day.key].end_time
  }
}

function resetForm() {
  branchForm.name = ''
  branchForm.city = ''
  branchForm.address = ''
  branchForm.timezone = 'Asia/Tashkent'
  branchForm.is_active = true
  resetWorkHours()
}

function openCreateModal() {
  editingId.value = null
  resetForm()
  createModalOpen.value = true
}

function openEditModal(row: BranchRow) {
  editingId.value = row.id
  branchForm.name = row.name || ''
  branchForm.city = row.city || ''
  branchForm.address = row.address || ''
  branchForm.timezone = row.timezone || 'Asia/Tashkent'
  branchForm.is_active = row.is_active !== false
  applyWorkHours(row.work_hours)
  editModalOpen.value = true
}

const { data, pending, refresh } = await useAsyncData('merchant-branches', async () => {
  return await merchantApi.branches()
})

const rows = computed(() =>
  ((data.value as any)?.items || []).flatMap((item: unknown) => {
    const row = toBranchRow(item)
    return row ? [row] : []
  })
)

const columns: TableColumn<BranchRow>[] = [
  { accessorKey: 'name', header: 'Филиал' },
  { accessorKey: 'city', header: 'Город' },
  { accessorKey: 'address', header: 'Адрес' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

async function submitCreate() {
  const name = normalizeText(branchForm.name)

  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Укажите название филиала.')
    return
  }

  submitting.value = true
  try {
    await merchantApi.createBranch({
      address: normalizeText(branchForm.address),
      city: normalizeText(branchForm.city),
      is_active: Boolean(branchForm.is_active),
      name,
      timezone: normalizeText(branchForm.timezone),
      work_hours: JSON.parse(JSON.stringify(workHours))
    })

    createModalOpen.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

async function submitEdit() {
  const id = editingId.value
  if (!id) return

  const name = normalizeText(branchForm.name)
  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Укажите название филиала.')
    return
  }

  submitting.value = true
  try {
    await merchantApi.updateBranch(id, {
      address: normalizeText(branchForm.address),
      city: normalizeText(branchForm.city),
      is_active: Boolean(branchForm.is_active),
      name,
      timezone: normalizeText(branchForm.timezone),
      work_hours: JSON.parse(JSON.stringify(workHours))
    })

    editModalOpen.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

async function removeRow(row: BranchRow) {
  if (import.meta.client && !window.confirm(`Безвозвратно удалить филиал «${row.name}»?`)) {
    return
  }

  submitting.value = true
  try {
    await merchantApi.deleteBranch(row.id)
    await refresh()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="merchant-branches">
    <template #header>
      <UDashboardNavbar title="Филиалы" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="pending"
            variant="outline"
            @click="refresh()"
          >
            Обновить
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" @click="openCreateModal">
            Добавить филиал
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
                  Список филиалов
                </h2>
                <p class="text-sm text-charcoal-500">
                  Только филиалы, относящиеся к вашему барбершопу.
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
              <template #address-cell="{ row }">
                <UButton
                  v-if="getExternalAddressUrl(row.original.address)"
                  color="neutral"
                  icon="i-lucide-map-pinned"
                  :to="getExternalAddressUrl(row.original.address) || undefined"
                  size="xs"
                  target="_blank"
                  variant="outline"
                >
                  Перейти в Карты
                </UButton>
                <span v-else class="text-sm text-charcoal-700">
                  {{ row.original.address || '—' }}
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
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEditModal(row.original)" />
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
            Филиалов пока нет.
          </div>
        </UCard>
      </div>

      <UModal
        v-model:open="createModalOpen"
        class="sm:max-w-2xl"
        title="Новый филиал"
        description="Заполните данные филиала. График работы указывается по дням."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="branchForm.name" placeholder="Например, Chilonzor филиал" />
            </UFormField>

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField label="Город">
                <UInput v-model="branchForm.city" placeholder="Например, Ташкент" />
              </UFormField>

              <UFormField label="Часовой пояс">
                <UInput v-model="branchForm.timezone" placeholder="Asia/Tashkent" />
              </UFormField>
            </div>

            <UFormField label="Адрес">
              <UInput v-model="branchForm.address" placeholder="Улица, дом" />
            </UFormField>

            <div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4">
              <p class="text-sm font-medium text-charcoal-950">
                График работы
              </p>
              <div class="mt-3 grid gap-3 md:grid-cols-2">
                <div v-for="day in days" :key="day.key" class="flex items-center justify-between gap-3">
                  <span class="text-sm text-charcoal-700">{{ day.label }}</span>
                  <div class="flex items-center gap-2">
                    <UInput v-model="workHours[day.key].start_time" type="time" />
                    <span class="text-xs text-charcoal-500">—</span>
                    <UInput v-model="workHours[day.key].end_time" type="time" />
                  </div>
                </div>
              </div>
            </div>

            <UFormField>
              <UCheckbox v-model="branchForm.is_active" label="Активен" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="createModalOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" :loading="submitting" @click="submitCreate">
              Создать
            </UButton>
          </div>
        </template>
      </UModal>

      <UModal
        v-model:open="editModalOpen"
        class="sm:max-w-2xl"
        title="Редактировать филиал"
        description="Изменения применяются только в кабинете мерчанта."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="branchForm.name" placeholder="Например, Chilonzor филиал" />
            </UFormField>

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField label="Город">
                <UInput v-model="branchForm.city" placeholder="Например, Ташкент" />
              </UFormField>

              <UFormField label="Часовой пояс">
                <UInput v-model="branchForm.timezone" placeholder="Asia/Tashkent" />
              </UFormField>
            </div>

            <UFormField label="Адрес">
              <UInput v-model="branchForm.address" placeholder="Улица, дом" />
            </UFormField>

            <div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4">
              <p class="text-sm font-medium text-charcoal-950">
                График работы
              </p>
              <div class="mt-3 grid gap-3 md:grid-cols-2">
                <div v-for="day in days" :key="day.key" class="flex items-center justify-between gap-3">
                  <span class="text-sm text-charcoal-700">{{ day.label }}</span>
                  <div class="flex items-center gap-2">
                    <UInput v-model="workHours[day.key].start_time" type="time" />
                    <span class="text-xs text-charcoal-500">—</span>
                    <UInput v-model="workHours[day.key].end_time" type="time" />
                  </div>
                </div>
              </div>
            </div>

            <UFormField>
              <UCheckbox v-model="branchForm.is_active" label="Активен" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="editModalOpen = false">
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
