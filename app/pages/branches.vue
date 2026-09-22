<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { VerifixSchedule } from '~/composables/useVerifixApi'

import type { Branch } from '~~/shared/schemas'
import { branchFormSchema, branchSchema } from '~~/shared/schemas'

const apiClient = useApiClient()

type BranchRow = {
  id: string
  name: string
  address: string | null
  city: string | null
  timezone: string | null
  marketplace_barbershop_id: string | null
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()

  return text || null
}

function getExternalAddressUrl(value: unknown) {
  const address = normalizeText(value)

  if (!address || !/^https?:\/\//i.test(address)) {
    return null
  }

  return address
}

function toBranchRow(value: unknown): BranchRow | null {
  const parsed = branchSchema.safeParse(value)

  if (!parsed.success) {
    return null
  }

  const branch = parsed.data as Branch

  return {
    id: String(branch.id),
    name: normalizeText(branch.name) || 'Филиал',
    address: normalizeText((branch as any).address),
    city: normalizeText((branch as any).city),
    timezone: normalizeText((branch as any).timezone),
    marketplace_barbershop_id: normalizeText((branch as any).marketplace_barbershop_id),
    is_active: (branch as any).is_active == null ? null : Boolean((branch as any).is_active)
  }
}

function extractBranchItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    items?: unknown[]
    branches?: unknown[]
    data?: unknown[] | { items?: unknown[], branches?: unknown[] }
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.branches)) {
    return payload.branches
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload.data && typeof payload.data === 'object') {
    if (Array.isArray(payload.data.items)) {
      return payload.data.items
    }

    if (Array.isArray(payload.data.branches)) {
      return payload.data.branches
    }
  }

  return []
}

const branchesApi = useBranchesApi()
const branchStore = useBranchStore()
const barbersApi = useBarbersApi()
const verifixApi = useVerifixApi()

const search = ref('')
const modalOpen = ref(false)
const submitting = ref(false)
const removingId = ref('')

const form = reactive({
  id: '',
  name: '',
  address: '',
  city: '',
  timezone: '',
  is_active: true
})

const columns: TableColumn<BranchRow>[] = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'city', header: 'Город' },
  { accessorKey: 'address', header: 'Адрес' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

const { data, pending, refresh } = await useAsyncData('branches-dashboard', async () => {
  return await branchesApi.list()
})

const { data: barbersData } = await useAsyncData('branches-verifix-barbers', async () => {
  return await barbersApi.list({ include_inactive: true })
})

const branchRows = computed<BranchRow[]>(() =>
  extractBranchItems(data.value).flatMap(item => {
    const row = toBranchRow(item)
    return row ? [row] : []
  })
)

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase()

  const rows = branchRows.value.filter(row => !row.marketplace_barbershop_id)

  if (!query) {
    return rows
  }

  return rows.filter((row) => {
    const haystack = [
      row.name,
      row.address || '',
      row.city || '',
      row.timezone || '',
      row.id
    ].join(' ').toLowerCase()

    return haystack.includes(query)
  })
})

const modalTitle = computed(() => form.id ? 'Редактировать филиал' : 'Создать филиал')
const modalDescription = computed(() => form.id ? 'Обновите параметры филиала и сохраните изменения.' : 'Заполните данные, чтобы добавить новый филиал.')

const bulkScheduleOpen = ref(false)
const bulkScheduleSubmitting = ref(false)
const bulkScheduleForm = reactive({ start_time: '10:00', end_time: '20:00', grace_minutes: 0 })
const allScheduleBranches = computed(() => branchRows.value.filter(branch => !branch.marketplace_barbershop_id))
async function saveBulkSchedule() {
  if (bulkScheduleSubmitting.value) return
  bulkScheduleSubmitting.value = true
  try {
    await verifixApi.bulkSchedules({
      branch_ids: allScheduleBranches.value.map(branch => branch.id),
      ...bulkScheduleForm
    })
    bulkScheduleOpen.value = false
    if (scheduleOpen.value) await refreshSchedules()
  } catch { /* The API client displays the error. */ }
  finally { bulkScheduleSubmitting.value = false }
}
async function applyScheduleToWeek() {
  if (!scheduleBranch.value || scheduleSubmitting.value) return
  scheduleSubmitting.value = true
  try {
    await verifixApi.bulkSchedules({
      branch_ids: [scheduleBranch.value.id],
      start_time: scheduleForm.start_time, end_time: scheduleForm.end_time,
      grace_minutes: scheduleForm.grace_minutes
    })
    resetScheduleForm()
    await refreshSchedules()
  } catch { /* The API client displays the error. */ }
  finally { scheduleSubmitting.value = false }
}

const scheduleOpen = ref(false)
const schedulesPending = ref(false)
const scheduleSubmitting = ref(false)
const scheduleBranch = ref<BranchRow | null>(null)
const scheduleEditingId = ref<string | null>(null)
const verifixSchedules = ref<VerifixSchedule[]>([])

const scheduleDays = [
  { label: 'Воскресенье', value: 0 },
  { label: 'Понедельник', value: 1 },
  { label: 'Вторник', value: 2 },
  { label: 'Среда', value: 3 },
  { label: 'Четверг', value: 4 },
  { label: 'Пятница', value: 5 },
  { label: 'Суббота', value: 6 }
]

const scheduleForm = reactive({
  barber_id: null as string | null,
  day_of_week: 1,
  end_time: '20:00',
  grace_minutes: 0,
  start_time: '10:00'
})

const scheduleBarberOptions = computed(() => {
  const branchId = scheduleBranch.value?.id
  const barbers = ((barbersData.value as any)?.items || []) as Array<{ branch_id: string | null, id: string, name: string | null }>

  return [
    { label: 'Все барберы филиала', value: null },
    ...barbers
      .filter(barber => barber.branch_id === branchId)
      .map(barber => ({ label: barber.name || 'Сотрудник', value: barber.id }))
  ]
})

const barberNameById = computed(() => new Map(
  (((barbersData.value as any)?.items || []) as Array<{ id: string, name: string | null }>)
    .map(barber => [barber.id, barber.name || 'Сотрудник'])
))

function resetScheduleForm() {
  scheduleEditingId.value = null
  scheduleForm.barber_id = null
  scheduleForm.day_of_week = 1
  scheduleForm.start_time = '10:00'
  scheduleForm.end_time = '20:00'
  scheduleForm.grace_minutes = 0
}

async function refreshSchedules() {
  const branch = scheduleBranch.value
  if (!branch) return

  schedulesPending.value = true
  try {
    const response = await verifixApi.schedules({ branch_id: branch.id })
    verifixSchedules.value = Array.isArray(response?.items) ? response.items.filter(schedule => schedule.is_active) : []
  }
  finally {
    schedulesPending.value = false
  }
}

async function openSchedules(row: BranchRow) {
  scheduleBranch.value = row
  resetScheduleForm()
  scheduleOpen.value = true
  await refreshSchedules()
}

function editSchedule(schedule: VerifixSchedule) {
  scheduleEditingId.value = schedule.id
  scheduleForm.barber_id = schedule.barber_id || null
  scheduleForm.day_of_week = schedule.day_of_week
  scheduleForm.start_time = String(schedule.start_time || '').slice(0, 5)
  scheduleForm.end_time = schedule.end_time ? String(schedule.end_time).slice(0, 5) : ''
  scheduleForm.grace_minutes = Number(schedule.grace_minutes || 0)
}

async function saveSchedule() {
  const branch = scheduleBranch.value
  if (!branch || !scheduleForm.start_time) return

  scheduleSubmitting.value = true
  try {
    const payload = {
      barber_id: scheduleForm.barber_id,
      branch_id: branch.id,
      day_of_week: Number(scheduleForm.day_of_week),
      end_time: scheduleForm.end_time || null,
      grace_minutes: Math.max(0, Number(scheduleForm.grace_minutes) || 0),
      start_time: scheduleForm.start_time
    }

    if (scheduleEditingId.value) {
      await verifixApi.updateSchedule(scheduleEditingId.value, payload)
    }
    else {
      await verifixApi.createSchedule(payload)
    }

    resetScheduleForm()
    await refreshSchedules()
  }
  finally {
    scheduleSubmitting.value = false
  }
}

async function deactivateSchedule(schedule: VerifixSchedule) {
  scheduleSubmitting.value = true
  try {
    await verifixApi.deactivateSchedule(schedule.id)
    if (scheduleEditingId.value === schedule.id) resetScheduleForm()
    await refreshSchedules()
  }
  finally {
    scheduleSubmitting.value = false
  }
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.address = ''
  form.city = ''
  form.timezone = ''
  form.is_active = true
}

function openCreateModal() {
  resetForm()
  modalOpen.value = true
}

function openEditModal(row: BranchRow) {
  form.id = row.id
  form.name = row.name
  form.address = row.address || ''
  form.city = row.city || ''
  form.timezone = row.timezone || ''
  form.is_active = row.is_active !== false
  modalOpen.value = true
}

async function submit() {
  const parsed = branchFormSchema.safeParse({
    name: form.name,
    address: form.address || undefined,
    city: form.city || undefined,
    timezone: form.timezone || undefined,
    is_active: form.is_active
  })

  if (!parsed.success) {
    apiClient.notifyError(new Error(parsed.error.issues[0]?.message || 'Проверьте данные'))
    return
  }

  submitting.value = true

  try {
    if (form.id) {
      await branchesApi.update(form.id, parsed.data)
    }
    else {
      await branchesApi.create(parsed.data)
    }

    await refresh()
    await branchStore.reload()
    modalOpen.value = false
  }
  finally {
    submitting.value = false
  }
}

async function removeBranch(row: BranchRow) {
  const label = row.name ? `«${row.name}»` : row.id

  if (import.meta.client && !window.confirm(`Удалить филиал ${label}?`)) {
    return
  }

  removingId.value = row.id

  try {
    let deleted = false

    try {
      await branchesApi.remove(row.id, { silent: true })
      deleted = true
    }
    catch (error: any) {
      const payload = error?.data || error?.response?._data || null
      const code = payload?.data?.code || payload?.code || null

      if (code === 'BRANCH_DELETE_HAS_QUEUE_ENTRIES') {
        if (import.meta.client && window.confirm(`В филиале ${label} есть записи очереди. Удалить филиал вместе с ними?`)) {
          await branchesApi.remove(row.id, { force: true })
          deleted = true
        }

        if (!deleted) {
          return
        }
      }
      else if (code === 'BRANCH_DELETE_HAS_USERS') {
        if (import.meta.client && window.confirm(`В филиале ${label} есть сотрудники. Удалить филиал и отвязать сотрудников от филиала?`)) {
          await branchesApi.remove(row.id, { force: true })
          deleted = true
        }

        if (!deleted) {
          return
        }
      }
      else if (code === 'BRANCH_DELETE_HAS_BARBERS') {
        if (import.meta.client && window.confirm(`В филиале ${label} есть мастера. Удалить филиал и отвязать мастеров от филиала?`)) {
          await branchesApi.remove(row.id, { force: true })
          deleted = true
        }

        if (!deleted) {
          return
        }
      }
      else {
        apiClient.notifyError(error)
        throw error
      }
    }

    if (!deleted) {
      return
    }

    await refresh()
    await branchStore.reload()
  }
  finally {
    removingId.value = ''
  }
}
</script>

<template>
  <UDashboardPanel id="branches">
    <template #header>
      <UDashboardNavbar
        class="service-categories-navbar"
        title="Филиалы"
        :ui="{ root: 'min-h-14 sm:min-h-16', right: 'gap-2 sm:gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-calendar-days"
            :disabled="pending || !allScheduleBranches.length"
            aria-label="Время для всех филиалов"
            @click="bulkScheduleOpen = true"
          >
            <span class="hidden sm:inline">Время для всех филиалов</span>
          </UButton>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="pending"
            variant="outline"
            aria-label="Обновить"
            @click="refresh()"
          >
            <span class="hidden sm:inline">Обновить</span>
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" aria-label="Создать филиал" @click="openCreateModal">
            <span class="hidden sm:inline">Создать</span>
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <template #header>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Справочник
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  Управление филиалами
                </h2>
              </div>

              <div class="flex flex-wrap items-center justify-end gap-3">
                <UInput v-model="search" placeholder="Поиск по названию, адресу или id" class="w-full sm:w-72" />

                <UBadge color="neutral" size="lg" variant="soft">
                  {{ filteredRows.length }} филиалов
                </UBadge>
              </div>
            </div>
          </template>

          <div
            v-if="filteredRows.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="columns" :data="filteredRows">
              <template #name-cell="{ row }">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium text-charcoal-950">{{ row.original.name }}</span>
                  <UBadge v-if="row.original.id === branchStore.activeBranchId" color="primary" size="xs" variant="soft">
                    Текущий
                  </UBadge>
                </div>
                <p class="mt-1 text-xs text-charcoal-500">
                  {{ row.original.id }}
                </p>
              </template>

              <template #city-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.city || '—' }}
                </span>
              </template>

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
                  variant="soft"
                >
                  {{ row.original.is_active === false ? 'Неактивен' : 'Активен' }}
                </UBadge>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    icon="i-lucide-calendar-clock"
                    title="График сотрудников Verifix"
                    variant="ghost"
                    size="xs"
                    @click="openSchedules(row.original)"
                  />
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEditModal(row.original)" />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :loading="removingId === row.original.id"
                    @click="removeBranch(row.original)"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <SharedEmptyState
            v-else-if="!pending"
            description="Филиалы не найдены или не удалось получить список."
            icon="i-lucide-store"
            title="Пусто"
          />

          <div v-else class="flex justify-center py-8">
            <ULoader size="lg" />
          </div>
        </UCard>
      </div>

      <UModal
        v-model:open="modalOpen"
        class="sm:max-w-xl"
        :description="modalDescription"
        :title="modalTitle"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название">
              <UInput v-model="form.name" />
            </UFormField>

            <UFormField label="Адрес">
              <UInput v-model="form.address" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Город">
                <UInput v-model="form.city" />
              </UFormField>

              <UFormField label="Timezone">
                <UInput v-model="form.timezone" placeholder="Asia/Tashkent" />
              </UFormField>
            </div>

            <UCheckbox v-model="form.is_active" label="Филиал активен" />
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex w-full flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="outline" :disabled="submitting" @click="resetForm">
              Сбросить
            </UButton>
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="close">
              Закрыть
            </UButton>
            <UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submit">
              {{ form.id ? 'Сохранить' : 'Создать' }}
            </UButton>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="bulkScheduleOpen" title="Время работы для всех филиалов" description="Одинаковое время с понедельника по воскресенье.">
        <template #body>
          <div class="space-y-4">
            <p class="text-sm text-charcoal-600">Будет заменён общий график {{ allScheduleBranches.length }} филиалов на все 7 дней. Персональные смены сотрудников сохраняются.</p>
            <div class="flex flex-wrap gap-2"><UBadge v-for="branch in allScheduleBranches" :key="branch.id" color="neutral">{{ branch.name }}</UBadge></div>
            <UFormField label="Начало работы"><UInput v-model="bulkScheduleForm.start_time" type="time" :disabled="bulkScheduleSubmitting" /></UFormField>
            <UFormField label="Конец работы"><UInput v-model="bulkScheduleForm.end_time" type="time" :disabled="bulkScheduleSubmitting" /></UFormField>
            <UFormField label="Допуск опоздания, минут"><UInput v-model.number="bulkScheduleForm.grace_minutes" type="number" min="0" step="1" :disabled="bulkScheduleSubmitting" /></UFormField>
          </div>
        </template>
        <template #footer>
          <UButton :loading="bulkScheduleSubmitting" :disabled="!allScheduleBranches.length || !bulkScheduleForm.start_time || !bulkScheduleForm.end_time || bulkScheduleForm.start_time === bulkScheduleForm.end_time || !Number.isInteger(bulkScheduleForm.grace_minutes) || bulkScheduleForm.grace_minutes < 0" @click="saveBulkSchedule">Применить ко всем филиалам на всю неделю</UButton>
        </template>
      </UModal>

      <UModal
        v-model:open="scheduleOpen"
        class="sm:max-w-3xl"
        :title="scheduleBranch ? `График сотрудников: ${scheduleBranch.name}` : 'График сотрудников'"
        description="График Verifix используется для расчёта опоздания в момент входа барбера."
      >
        <template #body>
          <div class="space-y-5">
            <div class="rounded-[1.25rem] border border-primary-200 bg-primary-50/60 p-4 text-sm text-charcoal-700">
              Общий график действует на всех барберов филиала, пока для сотрудника не задан персональный.
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField label="Сотрудник">
                <USelectMenu v-model="scheduleForm.barber_id" class="w-full" :items="scheduleBarberOptions" placeholder="Все барберы филиала" value-key="value" portal="body" />
              </UFormField>
              <UFormField label="День недели" required>
                <USelectMenu v-model="scheduleForm.day_of_week" class="w-full" :items="scheduleDays" value-key="value" portal="body" />
              </UFormField>
              <UFormField label="Начало смены" required>
                <UInput v-model="scheduleForm.start_time" type="time" />
              </UFormField>
              <UFormField label="Конец смены">
                <UInput v-model="scheduleForm.end_time" type="time" />
              </UFormField>
              <UFormField label="Допуск, минут">
                <UInput v-model.number="scheduleForm.grace_minutes" min="0" type="number" />
              </UFormField>
            </div>

            <div class="flex flex-wrap justify-end gap-3">
              <UButton v-if="!scheduleForm.barber_id" variant="outline" :disabled="!scheduleForm.start_time || !scheduleForm.end_time" :loading="scheduleSubmitting" @click="applyScheduleToWeek">Применить на все дни недели</UButton>
              <UButton v-if="scheduleEditingId" color="neutral" variant="ghost" :disabled="scheduleSubmitting" @click="resetScheduleForm">
                Отменить редактирование
              </UButton>
              <UButton color="primary" :disabled="!scheduleForm.start_time" :loading="scheduleSubmitting" @click="saveSchedule">
                {{ scheduleEditingId ? 'Сохранить изменения' : 'Добавить график' }}
              </UButton>
            </div>

            <div class="border-t border-charcoal-200 pt-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-charcoal-950">Активные смены</p>
                <UButton icon="i-lucide-refresh-cw" size="xs" variant="ghost" :loading="schedulesPending" @click="refreshSchedules" />
              </div>
              <div v-if="schedulesPending" class="py-6 text-center text-sm text-charcoal-500">Загрузка графика Verifix…</div>
              <div v-else-if="verifixSchedules.length" class="space-y-2">
                <div v-for="schedule in verifixSchedules" :key="schedule.id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-charcoal-200 bg-charcoal-50/60 px-4 py-3">
                  <div class="min-w-0">
                    <p class="font-medium text-charcoal-950">
                      {{ scheduleDays.find(day => day.value === schedule.day_of_week)?.label }} · <span v-if="schedule.is_working === false">Выходной</span><template v-else>{{ String(schedule.start_time).slice(0, 5) }}<span v-if="schedule.end_time">–{{ String(schedule.end_time).slice(0, 5) }}</span></template>
                    </p>
                    <p class="text-xs text-charcoal-500">
                      {{ schedule.barber_id ? (barberNameById.get(schedule.barber_id) || 'Сотрудник') : 'Все барберы филиала' }} · допуск {{ schedule.grace_minutes || 0 }} мин
                    </p>
                  </div>
                  <div class="flex shrink-0 gap-2">
                    <UButton icon="i-lucide-pencil" size="xs" variant="ghost" :disabled="schedule.is_working === false" :title="schedule.is_working === false ? 'Измените персональный график в карточке барбера' : undefined" @click="editSchedule(schedule)" />
                    <UButton icon="i-lucide-power" color="error" size="xs" variant="ghost" :disabled="scheduleSubmitting" @click="deactivateSchedule(schedule)" />
                  </div>
                </div>
              </div>
              <p v-else class="py-6 text-center text-sm text-charcoal-500">Активных смен ещё нет. Добавьте график, чтобы Verifix начал считать опоздания.</p>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="neutral" variant="ghost" @click="scheduleOpen = false">Закрыть</UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
