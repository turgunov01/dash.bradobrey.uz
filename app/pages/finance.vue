<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'

import { formatCount, formatMoney } from '~/utils/format'
import { flattenServicesPayload, type FlatServiceItem } from '~/utils/services'

type FinanceEmployeeDraft = {
  advances: number
  bonus_profit_percent: number
  penalty: number
  profit: number
  profit_percent: number
  salary: number
}

type FinanceSnapshotPayload = {
  employees: Record<string, FinanceEmployeeDraft>
}

type FinanceEmployeeRow = {
  id: string
  login: string | null
  name: string
  role: string | null
}

type FinanceDraftStorage = Record<string, FinanceSnapshotPayload>
type FinanceMoneyField = 'advances' | 'penalty' | 'salary'

const branchStore = useBranchStore()
const barbersApi = useBarbersApi()
const financeApi = useFinanceApi()
const historyApi = useHistoryApi()
const kioskApi = useKioskApi()
const apiClient = useApiClient()

await branchStore.ensureLoaded()

function currentPeriodKey() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function normalizeNumber(value: unknown, fallback = 0) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : fallback
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()

  return text || null
}

function toNumberOrNull(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const amount = Number(value)

  return Number.isFinite(amount) ? amount : null
}

function extractHistoryItems(response: unknown): Record<string, any>[] {
  if (Array.isArray(response)) {
    return response as Record<string, any>[]
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    data?: Record<string, any>[] | { history?: Record<string, any>[], items?: Record<string, any>[], records?: Record<string, any>[] }
    history?: Record<string, any>[]
    items?: Record<string, any>[]
    records?: Record<string, any>[]
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.history)) {
    return payload.history
  }

  if (Array.isArray(payload.records)) {
    return payload.records
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.data?.items)) {
    return payload.data.items
  }

  if (Array.isArray(payload.data?.history)) {
    return payload.data.history
  }

  if (Array.isArray(payload.data?.records)) {
    return payload.data.records
  }

  return []
}

function getPeriodRange(key: string) {
  const [yearPart = '', monthPart = ''] = key.split('-')
  const yearRaw = Number(yearPart)
  const monthRaw = Number(monthPart)
  const now = new Date()
  const year = Number.isInteger(yearRaw) && yearRaw > 0 ? yearRaw : now.getFullYear()
  const month = Number.isInteger(monthRaw) && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : now.getMonth() + 1
  const monthKey = String(month).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()

  return {
    end_date: `${year}-${monthKey}-${String(lastDay).padStart(2, '0')}`,
    start_date: `${year}-${monthKey}-01`
  }
}

function normalizeStatus(value: unknown) {
  return String(value || 'unknown').trim().toLowerCase()
}

function isCompletedStatus(value: unknown) {
  return ['completed', 'done', 'paid'].includes(normalizeStatus(value))
}

function pickTextValue(source: Record<string, any> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const rawValue = source?.[key]

    if (rawValue && typeof rawValue === 'object') {
      continue
    }

    const value = normalizeText(rawValue)

    if (value) {
      return value
    }
  }

  return null
}

function pickRecordValue(source: Record<string, any> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = source?.[key]

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, any>
    }
  }

  return null
}

const executingBarberRecordKeys = [
  'executing_barber',
  'executingBarber',
  'actual_barber',
  'actualBarber',
  'performer_barber',
  'performerBarber',
  'serving_barber',
  'servingBarber',
  'completed_by_barber',
  'completedByBarber',
  'performed_by',
  'performedBy',
  'barber'
]

const executingBarberIdKeys = [
  'executing_barber_id',
  'executingBarberId',
  'actual_barber_id',
  'actualBarberId',
  'performer_barber_id',
  'performerBarberId',
  'serving_barber_id',
  'servingBarberId',
  'completed_by_barber_id',
  'completedByBarberId',
  'performed_by_barber_id',
  'performedByBarberId',
  'performed_by',
  'performedBy',
  'barber_id',
  'barberId'
]

function getHistoryBarberId(item: Record<string, any>) {
  return pickTextValue(item, executingBarberIdKeys)
    || pickTextValue(pickRecordValue(item, executingBarberRecordKeys), ['id', 'user_id', 'userId'])
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]
}

function getHistoryServiceIds(item: Record<string, any>) {
  const ids: unknown[] = []

  if (item.service_id) {
    ids.push(item.service_id)
  }

  if (Array.isArray(item.service_ids)) {
    ids.push(...item.service_ids)
  }

  if (Array.isArray(item.services)) {
    ids.push(...item.services.map((service: any) => service?.id ?? service?.service_id))
  }

  return uniqueStrings(ids)
}

function getServicePrice(service?: FlatServiceItem | Record<string, any> | null) {
  return Math.max(0, normalizeNumber(service?.base_price ?? service?.price ?? service?.amount))
}

function getHistoryTimestamp(item: Record<string, any>) {
  const value = normalizeText(
    item.completed_at
    || item.completedAt
    || item.finished_at
    || item.finishedAt
    || item.created_at
    || item.createdAt
  )

  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

function isHistoryInPeriod(item: Record<string, any>, range: { end_date: string, start_date: string }) {
  const dateKey = getHistoryTimestamp(item)

  return !dateKey || (dateKey >= range.start_date && dateKey <= range.end_date)
}

function getHistoryDirectAmount(item: Record<string, any>) {
  const amountFields = [
    item.amount,
    item.order_total,
    item.orderTotal,
    item.total_amount,
    item.totalAmount,
    item.price_override,
    item.priceOverride,
    item.price
  ]

  for (const value of amountFields) {
    const amount = toNumberOrNull(value)

    if (amount !== null) {
      return Math.max(0, amount)
    }
  }

  return null
}

function getHistoryAmount(item: Record<string, any>, servicePriceMap: Map<string, number>) {
  const directAmount = getHistoryDirectAmount(item)

  if (directAmount !== null) {
    return directAmount
  }

  if (Array.isArray(item.services)) {
    const servicesAmount = item.services.reduce((sum: number, service: Record<string, any>) => {
      return sum + getServicePrice(service)
    }, 0)

    if (servicesAmount > 0) {
      return servicesAmount
    }
  }

  return getHistoryServiceIds(item).reduce((sum, serviceId) => {
    return sum + (servicePriceMap.get(serviceId) ?? 0)
  }, 0)
}

function createEmptyEmployeeDraft(): FinanceEmployeeDraft {
  return {
    advances: 0,
    bonus_profit_percent: 0,
    penalty: 0,
    profit: 0,
    profit_percent: 0,
    salary: 0
  }
}

function normalizeEmployeeDraft(value: unknown): FinanceEmployeeDraft {
  if (!value || typeof value !== 'object') {
    return createEmptyEmployeeDraft()
  }

  const source = value as Partial<FinanceEmployeeDraft>

  return {
    advances: Math.max(0, normalizeNumber(source.advances)),
    bonus_profit_percent: Math.max(0, normalizeNumber(source.bonus_profit_percent)),
    penalty: Math.max(0, normalizeNumber(source.penalty)),
    profit: Math.max(0, normalizeNumber(source.profit)),
    profit_percent: Math.max(0, normalizeNumber(source.profit_percent)),
    salary: Math.max(0, normalizeNumber(source.salary))
  }
}

function normalizePayload(value: unknown): FinanceSnapshotPayload {
  if (!value || typeof value !== 'object') {
    return { employees: {} }
  }

  const source = value as Partial<FinanceSnapshotPayload>
  const employeesSource = source.employees && typeof source.employees === 'object'
    ? source.employees as Record<string, unknown>
    : {}

  const employees: Record<string, FinanceEmployeeDraft> = {}

  for (const [id, draft] of Object.entries(employeesSource)) {
    const key = String(id || '').trim()

    if (!key) {
      continue
    }

    employees[key] = normalizeEmployeeDraft(draft)
  }

  return { employees }
}

function clonePayload(value: FinanceSnapshotPayload): FinanceSnapshotPayload {
  try {
    return JSON.parse(JSON.stringify(value)) as FinanceSnapshotPayload
  }
  catch {
    return normalizePayload(value)
  }
}

function buildEmployeeTitle(item: Record<string, any>) {
  const name = String(item?.name || '').trim()
  const login = String(item?.login || '').trim()

  return name || login || `Сотрудник ${String(item?.id || '').slice(0, 6)}`
}

const period = ref(currentPeriodKey())
const periodKey = computed(() => (/^\d{4}-\d{2}$/.test(period.value) ? period.value : currentPeriodKey()))
const periodRange = computed(() => getPeriodRange(periodKey.value))
const saving = ref(false)
const remoteLoading = ref(false)
const remoteError = ref<unknown>(null)
const hasLocalDraft = ref(false)
const dirty = ref(false)

const draftsStorage = useStorage<FinanceDraftStorage>('finance-drafts', {}, undefined, {
  deep: true,
  listenToStorageChanges: false
})

const storageKey = computed(() => `${branchStore.activeBranchId || 'global'}:${periodKey.value}`)
const payload = ref<FinanceSnapshotPayload>({ employees: {} })

watch(storageKey, (key) => {
  const stored = draftsStorage.value?.[key]
  hasLocalDraft.value = Boolean(stored)
  dirty.value = false
  payload.value = normalizePayload(stored)
}, { immediate: true })

watch(payload, (value) => {
  draftsStorage.value[storageKey.value] = clonePayload(value)
}, { deep: true })

function getEmployeeDraft(id: string): FinanceEmployeeDraft {
  const key = String(id || '').trim()

  if (!key) {
    return createEmptyEmployeeDraft()
  }

  const existing = payload.value.employees[key]

  if (existing) {
    return existing
  }

  const created = createEmptyEmployeeDraft()
  payload.value.employees[key] = created

  return created
}

function formatMoneyInputValue(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '')

  if (!digits) {
    return '0'
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function parseMoneyInputValue(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '')

  return normalizeNumber(digits)
}

function updateMoneyDraft(id: string, field: FinanceMoneyField, value: unknown) {
  getEmployeeDraft(id)[field] = parseMoneyInputValue(value)
  dirty.value = true
}

function commissionForDraft(draft: FinanceEmployeeDraft) {
  const profit = Math.max(0, draft.profit)
  const goal = Math.max(0, draft.salary)
  const basePercent = Math.max(0, draft.profit_percent)
  const bonusPercent = draft.bonus_profit_percent > 0
    ? Math.max(0, draft.bonus_profit_percent)
    : basePercent

  const profitToGoal = goal > 0 ? Math.min(profit, goal) : 0
  const profitAboveGoal = Math.max(0, profit - profitToGoal)

  return Math.round(
    (profitToGoal * basePercent) / 100
    + (profitAboveGoal * bonusPercent) / 100
  )
}

async function loadRemoteSnapshot(options: { overwrite?: boolean } = {}) {
  remoteLoading.value = true
  remoteError.value = null

  try {
    const snapshot = await financeApi.snapshot({ period: periodKey.value }, { silent: true })

    if (options.overwrite || (!hasLocalDraft.value && !dirty.value)) {
      payload.value = normalizePayload(snapshot?.payload)
      dirty.value = false
    }
  }
  catch (error) {
    remoteError.value = error
  }
  finally {
    remoteLoading.value = false
  }
}

watch([() => branchStore.activeBranchId, periodKey], async () => {
  await loadRemoteSnapshot()
}, { immediate: true })

const remoteNeedsMigration = computed(() => {
  const error = remoteError.value as any
  const code = error?.statusCode || error?.response?.status

  return code === 501
})

async function saveToRemote() {
  const branchId = branchStore.activeBranchId

  if (!branchId) {
    apiClient.notifyError(new Error('Не выбран филиал.'))
    return
  }

  if (!/^\d{4}-\d{2}$/.test(period.value)) {
    apiClient.notifyError(new Error('Укажите период в формате YYYY-MM.'))
    return
  }

  syncBarberProfitsFromHistory()

  saving.value = true

  try {
    await financeApi.upsert({
      branch_id: branchId,
      payload: payload.value,
      period: periodKey.value
    })

    dirty.value = false
    hasLocalDraft.value = true
    await loadRemoteSnapshot()
  }
  finally {
    saving.value = false
  }
}

async function refreshAll() {
  await Promise.allSettled([
    refreshEmployees(),
    refreshFinanceHistory(),
    refreshFinanceServices(),
    loadRemoteSnapshot()
  ])
}

function resetDraft() {
  dirty.value = true
  payload.value = { employees: {} }
}

const { data: employeeItems, pending: employeesPending, refresh: refreshEmployees } = await useAsyncData('finance-employees', async () => {
  const response = await barbersApi.list({ mode: 'employees' })
  return Array.isArray(response?.items) ? response.items : []
}, {
  watch: [() => branchStore.activeBranchId]
})

const { data: serviceItems, pending: financeServicesPending, refresh: refreshFinanceServices } = await useAsyncData('finance-services', async () => {
  const branchId = branchStore.activeBranchId || undefined
  const response = await kioskApi.services({ active: true, grouped: true, ...(branchId ? { branch_id: branchId } : {}) })

  return flattenServicesPayload(response)
}, {
  default: () => [] as FlatServiceItem[],
  server: false,
  watch: [() => branchStore.activeBranchId]
})

const {
  data: financeHistoryItems,
  pending: financeHistoryPending,
  refresh: refreshFinanceHistory,
  status: financeHistoryStatus
} = await useAsyncData('finance-history-profit', async () => {
  const branchId = branchStore.activeBranchId || undefined
  const range = periodRange.value
  const response = await historyApi.list({
    ...(branchId ? { branch_id: branchId } : {}),
    end_date: range.end_date,
    from: range.start_date,
    start_date: range.start_date,
    to: range.end_date
  })

  return extractHistoryItems(response)
}, {
  default: () => [] as Record<string, any>[],
  server: false,
  watch: [() => branchStore.activeBranchId, periodKey]
})

const employees = computed<FinanceEmployeeRow[]>(() =>
  (employeeItems.value || [])
    .map((item) => ({
      id: String(item.id),
      login: item.login ? String(item.login).trim() : null,
      name: buildEmployeeTitle(item as any),
      role: item.role ? String(item.role).trim() : null
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
)

const servicePriceMap = computed(() =>
  new Map<string, number>(
    (serviceItems.value || []).map((service): [string, number] => [
      String(service.id),
      getServicePrice(service)
    ])
  )
)

const historyProfitReady = computed(() => financeHistoryStatus.value === 'success')

const barberProfitMap = computed(() => {
  const rows = new Map<string, number>()
  const range = periodRange.value

  for (const item of financeHistoryItems.value || []) {
    if (!isCompletedStatus(item.status) || !isHistoryInPeriod(item, range)) {
      continue
    }

    const barberId = getHistoryBarberId(item)

    if (!barberId) {
      continue
    }

    rows.set(barberId, (rows.get(barberId) || 0) + getHistoryAmount(item, servicePriceMap.value))
  }

  return rows
})

function syncBarberProfitsFromHistory() {
  if (!historyProfitReady.value) {
    return
  }

  for (const employee of employees.value) {
    const draft = getEmployeeDraft(employee.id)
    const profit = Math.round(barberProfitMap.value.get(employee.id) || 0)

    if (draft.profit !== profit) {
      draft.profit = profit
    }
  }
}

watch([
  employees,
  barberProfitMap,
  historyProfitReady,
  () => payload.value
], syncBarberProfitsFromHistory, { immediate: true })

const totals = computed(() => {
  let salary = 0
  let profit = 0
  let advances = 0
  let penalties = 0
  let commission = 0
  let payout = 0

  for (const employee of employees.value) {
    const draft = getEmployeeDraft(employee.id)

    salary += draft.salary
    profit += draft.profit
    advances += draft.advances
    penalties += draft.penalty

    const earned = commissionForDraft(draft)
    commission += earned
    payout += draft.salary + earned - draft.advances - draft.penalty
  }

  return {
    advances,
    commission,
    netProfit: profit - payout,
    payout,
    penalties,
    profit,
    salary
  }
})

const columns: TableColumn<FinanceEmployeeRow>[] = [
  { accessorKey: 'name', header: 'Сотрудник' },
  { id: 'salary', header: 'План' },
  { id: 'profit', header: 'Val' },
  { id: 'profitPercent', header: 'Процент' },
  { id: 'bonusProfitPercent', header: 'Бонусный процент' },
  { id: 'advances', header: 'Авансы' },
  { id: 'penalty', header: 'Штраф' },
  { id: 'commission', header: 'С прибыли' }
]
</script>

<template>
  <UDashboardPanel id="finance">
    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge color="neutral" size="lg" variant="soft">
            {{ formatCount(employees.length) }} сотрудников
          </UBadge>
          <UBadge color="primary" size="lg" variant="soft">
            Итого: {{ formatMoney(totals.payout) }}
          </UBadge>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UInput v-model="period" type="month" size="sm" class="w-[9.5rem]" />
          <UButton color="primary" icon="i-lucide-save" :loading="saving" @click="saveToRemote">
            Сохранить
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-rotate-ccw"
            :disabled="saving || employeesPending"
            @click="resetDraft"
          >
            Сбросить
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="employeesPending || financeHistoryPending || financeServicesPending || remoteLoading"
            @click="refreshAll"
          >
            Обновить
          </UButton>
        </div>
      </div>

      <UAlert
        v-if="remoteNeedsMigration"
        color="warning"
        icon="i-lucide-database-zap"
        title="Нет таблицы finance_snapshots в Supabase"
        description="Данные сохраняются локально в браузере. Чтобы включить синхронизацию, создайте таблицу finance_snapshots и повторите сохранение."
        class="mb-4"
      />

      <div class="grid gap-3 pb-4 md:grid-cols-5">
        <UCard class="warm-card rounded-[1.25rem] border border-charcoal-200 bg-white/90 md:col-span-5">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                Оклад
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.salary) }}
              </p>
            </div>
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                Val
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.profit) }}
              </p>
            </div>
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                С прибыли
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.commission) }}
              </p>
            </div>
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                Авансы
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.advances) }}
              </p>
            </div>
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                Штрафы
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.penalties) }}
              </p>
            </div>
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                Прибыль
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.netProfit) }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <SharedEmptyState
        v-if="!employeesPending && !employees.length"
        title="Нет сотрудников"
        description="Добавьте сотрудников в разделе «Сотрудники», чтобы заполнять финансы."
        icon="i-lucide-users"
      />

      <div v-else class="flex flex-col max-h-[70vh] overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
        <div class="flex-1 overflow-auto">
          <UTable
            :columns="columns"
            :data="employees"
            :loading="employeesPending || financeHistoryPending"
            sticky="header"
            :ui="{
              root: 'w-full overflow-auto',
              base: 'w-full min-w-[72rem]',
              thead: 'bg-charcoal-50/90',
              tbody: 'divide-y divide-charcoal-100',
              th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
              td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
            }"
          >
            <template #name-cell="{ row }">
              <div class="space-y-1">
                <p class="font-semibold text-charcoal-950">
                  {{ row.original.name }}
                </p>
                <p v-if="row.original.login" class="text-xs text-charcoal-500">
                  @{{ row.original.login }}
                </p>
              </div>
            </template>

            <template #salary-cell="{ row }">
              <UInput
                :model-value="formatMoneyInputValue(getEmployeeDraft(row.original.id).salary)"
                inputmode="numeric"
                type="text"
                size="sm"
                class="w-32"
                @update:model-value="value => updateMoneyDraft(row.original.id, 'salary', value)"
              />
            </template>

            <template #profit-cell="{ row }">
              <div class="space-y-1">
                <p class="font-semibold text-charcoal-950">
                  {{ formatMoney(getEmployeeDraft(row.original.id).profit) }}
                </p>
                <p class="text-xs text-charcoal-500">
                  {{ financeHistoryPending ? 'Загрузка истории' : 'Из истории' }}
                </p>
              </div>
            </template>

            <template #profitPercent-cell="{ row }">
              <UInput
                v-model.number="getEmployeeDraft(row.original.id).profit_percent"
                type="number"
                min="0"
                step="0.1"
                size="sm"
                class="w-28"
                @update:model-value="dirty = true"
              />
            </template>

            <template #bonusProfitPercent-cell="{ row }">
              <UInput
                v-model.number="getEmployeeDraft(row.original.id).bonus_profit_percent"
                type="number"
                min="0"
                step="0.1"
                size="sm"
                class="w-28"
                @update:model-value="dirty = true"
              />
            </template>

            <template #advances-cell="{ row }">
              <UInput
                :model-value="formatMoneyInputValue(getEmployeeDraft(row.original.id).advances)"
                inputmode="numeric"
                type="text"
                size="sm"
                class="w-32"
                @update:model-value="value => updateMoneyDraft(row.original.id, 'advances', value)"
              />
            </template>

            <template #penalty-cell="{ row }">
              <UInput
                :model-value="formatMoneyInputValue(getEmployeeDraft(row.original.id).penalty)"
                inputmode="numeric"
                type="text"
                size="sm"
                class="w-32"
                @update:model-value="value => updateMoneyDraft(row.original.id, 'penalty', value)"
              />
            </template>

            <template #commission-cell="{ row }">
              <span class="font-semibold text-charcoal-950">
                {{ formatMoney(commissionForDraft(getEmployeeDraft(row.original.id))) }}
              </span>
            </template>
          </UTable>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
