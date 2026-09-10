<script setup lang="ts">
import { calculateMinutePenalty } from '~/utils/penalty'
import { useStorage } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'

import { formatCount, formatMoney } from '~/utils/format'
import { flattenServicesPayload, type FlatServiceItem } from '~/utils/services'
import type { VerifixEvent } from '~/composables/useVerifixApi'

type FinanceEmployeeDraft = {
  advances: number
  bonus_profit_percent: number
  penalty: number
  penalty_override?: boolean
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

type FinanceOverviewBranchRow = {
  id: string
  name: string
  orders: number
  payroll: number | null
  purchases: number
  turnover: number
}

type FinanceDraftStorage = Record<string, FinanceSnapshotPayload>
type FinanceMoneyField = 'advances' | 'salary'

const branchStore = useBranchStore()
const barbersApi = useBarbersApi()
const financeApi = useFinanceApi()
const penaltiesApi = usePenaltiesApi()
const historyApi = useHistoryApi()
const kioskApi = useKioskApi()
const verifixApi = useVerifixApi()
const { data: penaltySettings, error: penaltySettingsError, refresh: refreshPenaltySettings } = await useVerifixPenalty()
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

function getTimeMinutes(value: unknown) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/)

  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60
    ? hours * 60 + minutes
    : null
}

function getLocalEventDate(value: unknown) {
  const date = new Date(String(value || ''))

  return Number.isNaN(date.getTime()) ? null : date
}

function getVerifixEventDate(event: VerifixEvent) {
  const source = event as VerifixEvent & Record<string, unknown>

  return getLocalEventDate(
    source.occurred_at
    ?? source.occurredAt
    ?? source.login_at
    ?? source.loginAt
    ?? source.created_at
    ?? source.createdAt
    ?? source.timestamp
  )
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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
    penalty_override: source.penalty_override === true,
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

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : null
}

function unwrapOverviewResponse(value: unknown) {
  const source = asRecord(value)

  if (!source) {
    return {}
  }

  return {
    ...source,
    ...(asRecord(source.data) || {}),
    ...(asRecord(source.overview) || {})
  }
}

function pickNumber(source: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const amount = toNumberOrNull(source?.[key])

    if (amount !== null) {
      return amount
    }
  }

  return 0
}

function pickMoneyValue(source: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const directAmount = toNumberOrNull(source?.[key])

    if (directAmount !== null) {
      return directAmount
    }

    const nested = asRecord(source?.[key])

    if (!nested) {
      continue
    }

    for (const nestedKey of ['payout', 'payroll', 'payroll_total', 'total', 'amount', 'turnover', 'salary']) {
      const nestedAmount = toNumberOrNull(nested[nestedKey])

      if (nestedAmount !== null) {
        return nestedAmount
      }
    }
  }

  return 0
}

function pickArray(source: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = source?.[key]

    if (Array.isArray(value)) {
      return value as Record<string, any>[]
    }
  }

  return []
}

const period = ref(currentPeriodKey())
const periodKey = computed(() => (/^\d{4}-\d{2}$/.test(period.value) ? period.value : currentPeriodKey()))
const periodRange = computed(() => getPeriodRange(periodKey.value))
const saving = ref(false)
const remoteLoading = ref(false)
const remoteError = ref<unknown>(null)
const hasLocalDraft = ref(false)
const dirty = ref(false)

const { data: overviewData, pending: overviewPending, refresh: refreshOverview } = await useAsyncData('finance-overview', async () => {
  return await financeApi.overview(periodKey.value, { silent: true })
}, {
  default: () => ({}),
  watch: [periodKey]
})

const { data: manualPenaltiesData } = await useAsyncData('finance-manual-penalties', async () => {
  const query: Record<string, unknown> = { period: periodKey.value }
  if (branchStore.activeBranchId) query.branch_id = branchStore.activeBranchId
  return await penaltiesApi.list(query)
}, {
  default: () => ({ items: [] }),
  watch: [periodKey, () => branchStore.activeBranchId]
})

function extractPenaltyItems(value: unknown): Record<string, any>[] {
  if (Array.isArray(value)) return value as Record<string, any>[]
  if (!value || typeof value !== 'object') return []
  const source = value as Record<string, any>
  for (const key of ['items', 'data', 'rows', 'records', 'penalties']) {
    if (Array.isArray(source[key])) return source[key]
  }
  return []
}

function penaltyItemAmount(item: Record<string, any>) {
  const amount = normalizeNumber(item.amount ?? item.total_amount)
  if (amount > 0 || item.source !== 'late_minutes') return Math.max(0, amount)
  const minutes = normalizeNumber(item.late_minutes ?? item.late_by_minutes)
  const rate = Number(penaltySettings.value?.penalty_per_minute ?? 0)
  return calculateMinutePenalty(minutes, rate)
}

const manualPenaltiesByEmployee = computed(() => {
  const result = new Map<string, number>()
  for (const item of extractPenaltyItems(manualPenaltiesData.value)) {
    if (item.canceled === true || item.source === 'late_minutes') continue
    const employeeId = String(item.recipient?.id || item.recipient_id || '').trim()
    if (!employeeId) continue
    const amount = normalizeNumber(item.amount || item.total_amount)
    result.set(employeeId, (result.get(employeeId) || 0) + Math.max(0, amount))
  }
  return result
})

const latePenaltiesByEmployee = computed(() => {
  const result = new Map<string, number>()
  for (const item of extractPenaltyItems(manualPenaltiesData.value)) {
    if (item.canceled === true || item.source !== 'late_minutes') continue
    const employeeId = String(item.recipient?.id || item.recipient_id || '').trim()
    if (!employeeId) continue
    result.set(employeeId, (result.get(employeeId) || 0) + penaltyItemAmount(item))
  }
  return result
})

const latePenaltyStatsByEmployee = computed(() => {
  const result = new Map<string, { count: number, minutes: number }>()
  for (const item of extractPenaltyItems(manualPenaltiesData.value)) {
    if (item.canceled === true || item.source !== 'late_minutes') continue
    const employeeId = String(item.recipient?.id || item.recipient_id || '').trim()
    if (!employeeId) continue
    const current = result.get(employeeId) || { count: 0, minutes: 0 }
    current.count += 1
    current.minutes += Math.max(0, normalizeNumber(item.late_minutes ?? item.late_by_minutes))
    result.set(employeeId, current)
  }
  return result
})

const hasApiLatePenalties = computed(() => extractPenaltyItems(manualPenaltiesData.value).some(item => item.source === 'late_minutes'))

const activePenaltyTotal = computed(() => {
  const items = extractPenaltyItems(manualPenaltiesData.value)
  return items.reduce((sum, item) => {
    if (item.canceled === true) return sum
    return sum + penaltyItemAmount(item)
  }, 0)
})

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

function updatePenaltyDraft(id: string, value: unknown) {
  const draft = getEmployeeDraft(id)
  const amount = Number(value)

  draft.penalty = Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100) / 100) : 0
  draft.penalty_override = true
  dirty.value = true
}

function resetPenaltyDraft(id: string) {
  const draft = getEmployeeDraft(id)
  draft.penalty_override = false
  draft.penalty = calculatedPenaltyForEmployee(id)
  dirty.value = true
}

function commissionForDraft(draft: FinanceEmployeeDraft) {
  const profit = Math.max(0, draft.profit)
  const plan = Math.max(0, draft.salary)
  // Процент — доля выручки барбершопа: сотрудник получает остаток.
  const barbershopPercent = Math.min(100, Math.max(0, draft.profit_percent))
  const bonusPercent = Math.max(0, draft.bonus_profit_percent)
  const profitAbovePlan = plan > 0 ? Math.max(0, profit - plan) : 0

  return Math.round(
    (profit * (100 - barbershopPercent)) / 100
    + (profitAbovePlan * bonusPercent) / 100
  )
}

function profitShareForDraft(draft: FinanceEmployeeDraft) {
  return Math.round(
    commissionForDraft(draft)
    - Math.max(0, draft.advances)
    - Math.max(0, draft.penalty)
  )
}

function payoutForDraft(draft: FinanceEmployeeDraft) {
  return profitShareForDraft(draft)
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
  if (!penaltySettings.value || penaltySettingsError.value) return
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
  syncBarberPenalties()

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
    refreshOverview(),
    refreshFinanceHistory(),
    refreshFinanceServices(),
    refreshVerifix(),
    refreshPenaltySettings(),
    refreshVerifixSchedules(),
    refreshBranchPayrolls(),
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
  const response = await historyApi.listAll({
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

const {
  data: verifixLoginItems,
  pending: verifixPending,
  refresh: refreshVerifix
} = await useAsyncData('finance-verifix-logins', async () => {
  const branchId = branchStore.activeBranchId || undefined
  const range = periodRange.value
  const response = await verifixApi.events({
    ...(branchId ? { branch_id: branchId } : {}),
    end_date: range.end_date,
    limit: 500,
    start_date: range.start_date
  }, { silent: true })

  return Array.isArray(response?.items) ? response.items : []
}, {
  default: () => [] as VerifixEvent[],
  server: false,
  watch: [() => branchStore.activeBranchId, periodKey]
})

const {
  data: verifixSchedules,
  pending: verifixSchedulesPending,
  refresh: refreshVerifixSchedules
} = await useAsyncData('finance-verifix-schedules', async () => {
  const branchId = branchStore.activeBranchId

  if (!branchId) {
    return []
  }

  const response = await verifixApi.schedules({ branch_id: branchId })

  return Array.isArray(response?.items) ? response.items : []
}, {
  default: () => [],
  server: false,
  watch: [() => branchStore.activeBranchId]
})

const {
  data: branchPayrolls,
  pending: branchPayrollsPending,
  refresh: refreshBranchPayrolls
} = await useAsyncData('finance-branch-payrolls', async () => {
  const payrolls: Record<string, number> = {}

  await Promise.all(branchStore.branches.map(async (branch) => {
    try {
      const snapshot = await financeApi.snapshot({
        branch_id: branch.id,
        period: periodKey.value
      }, { silent: true })
      const branchPayload = normalizePayload(snapshot?.payload)

      payrolls[String(branch.id)] = Object.values(branchPayload.employees)
        .reduce((sum, draft) => sum + payoutForDraft(draft), 0)
    }
    catch {
      // An unavailable snapshot must not be replaced by an approximate value
      // from overview: the table displays an em dash instead.
    }
  }))

  return payrolls
}, {
  default: () => ({} as Record<string, number>),
  server: false,
  watch: [periodKey, () => branchStore.branches.map(branch => branch.id).join(',')]
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

const branchNameMap = computed(() =>
  new Map(
    branchStore.branches.map(branch => [
      String(branch.id),
      String(branch.name || branch.id)
    ])
  )
)

const overviewSource = computed(() => unwrapOverviewResponse(overviewData.value))

const overviewBranchRows = computed<FinanceOverviewBranchRow[]>(() => {
  const items = pickArray(overviewSource.value, [
    'branches',
    'branch_breakdown',
    'branchBreakdown',
    'by_branch',
    'byBranch',
    'revenue_by_branch',
    'turnover_by_branch'
  ])

  return items.flatMap((item, index) => {
    const id = normalizeText(
      item.branch_id
      || item.branchId
      || item.id
      || item.object_id
      || item.objectId
    ) || `branch-${index}`
    const name = normalizeText(
      item.branch_name
      || item.branchName
      || item.name
      || item.title
    ) || branchNameMap.value.get(id) || id

    return [{
      id,
      name,
      orders: pickNumber(item, ['orders', 'orders_count', 'ordersCount', 'completed', 'completed_count']),
      payroll: branchPayrolls.value[id] ?? null,
      purchases: pickMoneyValue(item, ['purchases', 'purchases_total', 'purchase_total', 'warehouse_purchases']),
      turnover: pickMoneyValue(item, ['turnover', 'turnover_total', 'revenue', 'revenue_total', 'total_revenue', 'amount', 'total'])
    }]
  })
})

const overviewTotals = computed(() => {
  const source = overviewSource.value
  const branches = overviewBranchRows.value
  const fallbackTurnover = branches.reduce((sum, row) => sum + row.turnover, 0)
  const fallbackPayroll = branches.reduce((sum, row) => sum + (row.payroll ?? 0), 0)
  const fallbackPurchases = branches.reduce((sum, row) => sum + row.purchases, 0)

  return {
    branches: branches.length || pickNumber(source, ['branches_count', 'branchesCount', 'branch_count']),
    payroll: fallbackPayroll,
    purchases: pickMoneyValue(source, ['purchases', 'purchases_total', 'purchase_total', 'warehouse_purchases']) || fallbackPurchases,
    turnover: pickMoneyValue(source, ['turnover', 'turnover_total', 'revenue', 'revenue_total', 'total_revenue', 'gross_turnover']) || fallbackTurnover
  }
})

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

const selectedBranchTurnover = computed(() => {
  const range = periodRange.value

  return (financeHistoryItems.value || []).reduce((sum, item) => {
    if (!isCompletedStatus(item.status) || !isHistoryInPeriod(item, range)) {
      return sum
    }

    return sum + getHistoryAmount(item, servicePriceMap.value)
  }, 0)
})

const branchSchedulesByDay = computed(() => {
  const rows = new Map<number, { graceMinutes: number, startMinutes: number }>()

  for (const schedule of verifixSchedules.value || []) {
    if (!schedule.is_active || schedule.barber_id) {
      continue
    }

    const startMinutes = getTimeMinutes(schedule.start_time)

    if (startMinutes === null || rows.has(schedule.day_of_week)) {
      continue
    }

    rows.set(schedule.day_of_week, {
      graceMinutes: Math.max(0, normalizeNumber(schedule.grace_minutes)),
      startMinutes
    })
  }

  return rows
})

function isLoginEvent(event: VerifixEvent) {
  const source = event as VerifixEvent & Record<string, unknown>
  const type = String(source.event_type ?? source.eventType ?? '').trim().toLowerCase()

  // Older backend records may not have event_type; in that case each record
  // in this endpoint is treated as an entry event.
  return !type || [
    'check_in',
    'checkin',
    'clock_in',
    'clockin',
    'entry',
    'login',
    'sign_in',
    'signin'
  ].some(loginType => type === loginType || type.includes(loginType))
}

const barberLateMap = computed(() => {
  const rows = new Map<string, { count: number, minutes: number }>()
  const firstLogins = new Map<string, Date>()

  for (const event of verifixLoginItems.value || []) {
    if (!isLoginEvent(event)) {
      continue
    }

    const source = event as VerifixEvent & Record<string, unknown>
    const metadata = source.metadata && typeof source.metadata === 'object'
      ? source.metadata as Record<string, unknown>
      : {}
    if (metadata.canceled === true) {
      continue
    }
    const barberId = normalizeText(source.barber_id ?? source.barberId)
    const occurredAt = getVerifixEventDate(event)

    if (!barberId || !occurredAt) {
      continue
    }

    const key = `${barberId}:${getDateKey(occurredAt)}`
    const current = firstLogins.get(key)

    if (!current || occurredAt.getTime() < current.getTime()) {
      firstLogins.set(key, occurredAt)
    }
  }

  for (const [key, loginAt] of firstLogins) {
    const separatorIndex = key.indexOf(':')
    const barberId = key.slice(0, separatorIndex)
    const schedule = branchSchedulesByDay.value.get(loginAt.getDay())

    if (!schedule) {
      continue
    }

    const loginMinutes = loginAt.getHours() * 60 + loginAt.getMinutes()
    const lateMinutes = Math.max(0, loginMinutes - schedule.startMinutes - schedule.graceMinutes)

    if (!lateMinutes) {
      continue
    }

    const current = rows.get(barberId) || { count: 0, minutes: 0 }
    current.count += 1
    current.minutes += lateMinutes
    rows.set(barberId, current)
  }

  return rows
})

const lateTotals = computed(() => {
  let count = 0
  let minutes = 0

  const source = hasApiLatePenalties.value ? latePenaltyStatsByEmployee.value : barberLateMap.value
  for (const value of source.values()) {
    count += value.count
    minutes += value.minutes
  }

  return { count, minutes }
})

function getEmployeeLate(id: string) {
  if (hasApiLatePenalties.value) {
    return latePenaltyStatsByEmployee.value.get(String(id || '').trim()) || { count: 0, minutes: 0 }
  }
  return barberLateMap.value.get(String(id || '').trim()) || { count: 0, minutes: 0 }
}

function calculatedPenaltyForEmployee(id: string) {
  return calculateMinutePenalty(getEmployeeLate(id).minutes, Number(penaltySettings.value?.penalty_per_minute ?? 0))
}

function penaltyForEmployee(id: string) {
  const draft = payload.value.employees[String(id || '').trim()]
  const employeeId = String(id || '').trim()
  const manualPenalty = manualPenaltiesByEmployee.value.get(employeeId) || 0
  const apiLatePenalty = latePenaltiesByEmployee.value.get(employeeId)
  const latePenalty = apiLatePenalty === undefined ? calculatedPenaltyForEmployee(employeeId) : apiLatePenalty

  return draft?.penalty_override
    ? Math.max(0, normalizeNumber(draft.penalty)) + manualPenalty
    : latePenalty + manualPenalty
}

function syncBarberPenalties() {
  if (!penaltySettings.value || penaltySettingsError.value) return
  for (const employee of employees.value) {
    const draft = getEmployeeDraft(employee.id)
    if (draft.penalty_override) continue

    const penalty = calculatedPenaltyForEmployee(employee.id)

    if (draft.penalty !== penalty) {
      draft.penalty = penalty
    }
  }
}

function getEmployeeDraftWithCalculatedPenalty(id: string) {
  return {
    ...getEmployeeDraft(id),
    penalty: penaltyForEmployee(id)
  }
}

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
  barberLateMap,
  branchSchedulesByDay,
  penaltySettings,
  periodKey,
  () => payload.value
], syncBarberPenalties, { immediate: true })

watch([
  employees,
  barberProfitMap,
  historyProfitReady,
  () => payload.value
], syncBarberProfitsFromHistory, { immediate: true })

const totals = computed(() => {
  let plan = 0
  let profit = 0
  let advances = 0
  let penalties = 0
  let commission = 0
  let payout = 0

  for (const employee of employees.value) {
    const draft = getEmployeeDraft(employee.id)

    plan += draft.salary
    profit += draft.profit
    advances += draft.advances
    const penalty = penaltyForEmployee(employee.id)

    penalties += penalty
    commission += profitShareForDraft({ ...draft, penalty })
    payout += payoutForDraft({ ...draft, penalty })
  }

  return {
    advances,
    commission,
    netProfit: profit - payout,
    payout,
    penalties: extractPenaltyItems(manualPenaltiesData.value).length ? activePenaltyTotal.value : penalties,
    profit,
    plan
  }
})

// Это единственный источник зарплатного фонда для выбранного филиала:
// точная сумма всех строк «К выплате» в таблице, включая авансы, штрафы
// и рассчитанные проценты.
const selectedBranchPayroll = computed(() => totals.value.payout)

const overviewBranchColumns: TableColumn<FinanceOverviewBranchRow>[] = [
  { accessorKey: 'name', header: 'Филиал' },
  { accessorKey: 'turnover', header: 'Оборот' },
  { accessorKey: 'payroll', header: 'Зарплатный фонд' },
  { accessorKey: 'purchases', header: 'Закупки' },
  { accessorKey: 'orders', header: 'Заказы' }
]

const columns: TableColumn<FinanceEmployeeRow>[] = [
  { accessorKey: 'name', header: 'Сотрудник' },
  { id: 'salary', header: 'План' },
  { id: 'profit', header: 'Val' },
  { id: 'profitPercent', header: 'Процент барбершопа' },
  { id: 'bonusProfitPercent', header: 'Бонусный процент' },
  { id: 'advances', header: 'Авансы' },
  { id: 'penalty', header: 'Штраф' },
  { id: 'late', header: 'Опоздания по графику' },
  { id: 'commission', header: 'С прибыли' },
  { id: 'payout', header: 'К выплате' }
]
</script>

<template>
  <UDashboardPanel id="finance">
    <template #body>
      <VerifixPenaltySettings />
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
          <UButton color="primary" icon="i-lucide-save" :loading="saving" :disabled="!penaltySettings || !!penaltySettingsError" @click="saveToRemote">
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
            :loading="employeesPending || financeHistoryPending || financeServicesPending || verifixPending || verifixSchedulesPending || branchPayrollsPending || remoteLoading || overviewPending"
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
        title="Нет таблицы finance_snapshots в backend PostgreSQL"
        description="Данные сохраняются локально в браузере. Чтобы включить синхронизацию, примените backend-миграцию finance_snapshots и повторите сохранение."
        class="mb-4"
      />

      <div class="grid gap-4 pb-4 md:grid-cols-4">
        <DashboardMetricCard
          description="Сумма только выполненных заказов выбранного филиала за выбранный месяц."
          icon="i-lucide-wallet"
          label="Оборот"
          :value="formatMoney(selectedBranchTurnover)"
        />
        <DashboardMetricCard
          description="Точная сумма «К выплате» по таблице выбранного филиала."
          icon="i-lucide-users"
          label="Зарплатный фонд"
          :value="formatMoney(selectedBranchPayroll)"
        />
        <DashboardMetricCard
          description="Закупки склада за выбранный период."
          icon="i-lucide-package"
          label="Закупки"
          :value="formatMoney(overviewTotals.purchases)"
        />
        <DashboardMetricCard
          description="Филиалы, попавшие в финансовую сводку."
          icon="i-lucide-store"
          label="Филиалы"
          :value="formatCount(overviewTotals.branches)"
        />
      </div>

      <UCard
        v-if="overviewBranchRows.length"
        class="warm-card mb-4 rounded-[1.25rem] border border-charcoal-200 bg-white/90"
      >
        <template #header>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="barbershop-heading text-xl text-charcoal-950">
                Разбивка по филиалам
              </h2>
              <p class="text-sm text-charcoal-500">
                Зарплатный фонд — сумма «К выплате» из финансовой таблицы каждого филиала за {{ periodKey }}.
              </p>
            </div>
            <UBadge color="neutral" size="lg" variant="soft">
              {{ overviewBranchRows.length }} филиалов
            </UBadge>
          </div>
        </template>

        <div class="overflow-x-auto rounded-[1.25rem] border border-charcoal-200 bg-white/90">
          <UTable
            :columns="overviewBranchColumns"
            :data="overviewBranchRows"
            :loading="overviewPending || branchPayrollsPending"
            :ui="{
              root: 'w-full overflow-auto',
              base: 'w-full min-w-[44rem]',
              thead: 'bg-charcoal-50/90',
              tbody: 'divide-y divide-charcoal-100',
              th: 'px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-charcoal-500 whitespace-nowrap',
              td: 'px-3 py-4 text-sm text-charcoal-700 align-middle whitespace-nowrap'
            }"
          >
            <template #turnover-cell="{ row }">
              <span class="font-semibold text-charcoal-950">
                {{ formatMoney(row.original.id === branchStore.activeBranchId ? selectedBranchTurnover : row.original.turnover) }}
              </span>
            </template>
            <template #payroll-cell="{ row }">
              <template v-if="row.original.id === branchStore.activeBranchId">
                {{ formatMoney(selectedBranchPayroll) }}
              </template>
              <template v-else-if="row.original.payroll !== null">
                {{ formatMoney(row.original.payroll) }}
              </template>
              <template v-else>—</template>
            </template>
            <template #purchases-cell="{ row }">
              {{ formatMoney(row.original.purchases) }}
            </template>
            <template #orders-cell="{ row }">
              {{ formatCount(row.original.orders) }}
            </template>
          </UTable>
        </div>
      </UCard>

      <div class="grid gap-3 pb-4 md:grid-cols-5">
        <UCard class="warm-card rounded-[1.25rem] border border-charcoal-200 bg-white/90 md:col-span-5">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                План оборота
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.plan) }}
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
                Опозданий по графику за месяц
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatCount(lateTotals.count) }}
              </p>
              <p class="text-xs text-charcoal-500">
                {{ formatCount(lateTotals.minutes) }} мин · для учёта штрафа за график
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

      <div v-else class="space-y-4">
        <!-- Мобильная версия: карточки по сотруднику (таблица не помещается на телефоне) -->
        <div class="space-y-3 xl:hidden">
          <div
            v-for="row in employees"
            :key="row.id"
            class="rounded-[1.25rem] border border-charcoal-200 bg-white/90 p-4 space-y-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-semibold text-charcoal-950 truncate">
                  {{ row.name }}
                </p>
                <p v-if="row.login" class="text-xs text-charcoal-500 truncate">
                  @{{ row.login }}
                </p>
              </div>
              <div class="shrink-0 text-right">
                <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-500">
                  К выплате
                </p>
                <p class="text-base font-semibold text-primary-600">
                  {{ formatMoney(payoutForDraft(getEmployeeDraftWithCalculatedPenalty(row.id))) }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <label class="space-y-1">
                <span class="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal-500">План</span>
                <UInput
                  :model-value="formatMoneyInputValue(getEmployeeDraft(row.id).salary)"
                  inputmode="numeric"
                  type="text"
                  size="sm"
                  class="w-full"
                  @update:model-value="value => updateMoneyDraft(row.id, 'salary', value)"
                />
              </label>
              <label class="space-y-1">
                <span class="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal-500">Процент барбершопа</span>
                <UInput
                  v-model.number="getEmployeeDraft(row.id).profit_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  size="sm"
                  class="w-full"
                  @update:model-value="dirty = true"
                />
              </label>
              <label class="space-y-1">
                <span class="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal-500">Бонусный %</span>
                <UInput
                  v-model.number="getEmployeeDraft(row.id).bonus_profit_percent"
                  type="number"
                  min="0"
                  step="0.1"
                  size="sm"
                  class="w-full"
                  @update:model-value="dirty = true"
                />
              </label>
              <label class="space-y-1">
                <span class="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal-500">Авансы</span>
                <UInput
                  :model-value="formatMoneyInputValue(getEmployeeDraft(row.id).advances)"
                  inputmode="numeric"
                  type="text"
                  size="sm"
                  class="w-full"
                  @update:model-value="value => updateMoneyDraft(row.id, 'advances', value)"
                />
              </label>
              <div class="space-y-1">
                <span class="text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal-500">Штраф</span>
                <p class="flex min-h-8 items-center rounded-md border border-charcoal-200 bg-charcoal-50 px-3 text-sm font-semibold text-charcoal-950">
                  {{ formatMoney(penaltyForEmployee(row.id)) }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 border-t border-charcoal-100 pt-3">
              <div>
                <p class="text-[11px] uppercase tracking-[0.12em] text-charcoal-500">Val</p>
                <p class="text-sm font-semibold text-charcoal-950">
                  {{ formatMoney(getEmployeeDraft(row.id).profit) }}
                </p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-[0.12em] text-charcoal-500">С прибыли</p>
                <p class="text-sm font-semibold text-charcoal-950">
                  {{ formatMoney(profitShareForDraft(getEmployeeDraftWithCalculatedPenalty(row.id))) }}
                </p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-[0.12em] text-charcoal-500">Опоздания по графику</p>
                <p
                  class="text-sm font-semibold"
                  :class="getEmployeeLate(row.id).count ? 'text-red-600' : 'text-charcoal-950'"
                >
                  {{ formatCount(getEmployeeLate(row.id).count) }}
                  <span class="text-[11px] font-normal text-charcoal-500">/ {{ formatCount(getEmployeeLate(row.id).minutes) }} мин</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Планшет/десктоп: таблица -->
        <div class="hidden xl:block max-h-[70vh] overflow-x-auto overflow-y-auto rounded-[1.25rem] border border-charcoal-200 bg-white/90">
          <UTable
            :columns="columns"
            :data="employees"
            :loading="employeesPending || financeHistoryPending || verifixPending || verifixSchedulesPending"
            sticky="header"
            :ui="{
              root: 'w-full overflow-auto',
              base: 'w-full min-w-[80rem]',
              thead: 'bg-charcoal-50/90',
              tbody: 'divide-y divide-charcoal-100',
              th: 'px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-charcoal-500 whitespace-nowrap',
              td: 'px-3 py-4 text-sm text-charcoal-700 align-middle whitespace-nowrap'
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
                max="100"
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
              <div class="space-y-1">
                <UInput
                  :model-value="penaltyForEmployee(row.original.id)"
                  type="number"
                  min="0"
                  step="0.01"
                  size="sm"
                  class="w-32"
                  @update:model-value="value => updatePenaltyDraft(row.original.id, value)"
                />
                <p class="text-xs text-charcoal-500">
                  {{ getEmployeeDraft(row.original.id).penalty_override ? 'Вручную' : (penaltySettings ? `${formatMoney(penaltySettings.penalty_per_minute)} / мин` : 'Ставка не загружена') }}
                </p>
                <UButton
                  v-if="getEmployeeDraft(row.original.id).penalty_override"
                  size="xs"
                  color="neutral"
                  variant="link"
                  class="px-0"
                  @click="resetPenaltyDraft(row.original.id)"
                >Авто</UButton>
              </div>
            </template>

            <template #late-cell="{ row }">
              <div class="space-y-1">
                <p
                  class="font-semibold"
                  :class="getEmployeeLate(row.original.id).count ? 'text-red-600' : 'text-charcoal-950'"
                >
                  {{ formatCount(getEmployeeLate(row.original.id).count) }}
                </p>
                <p class="text-xs text-charcoal-500">
                  {{ verifixPending ? 'Загрузка Verifix' : `${formatCount(getEmployeeLate(row.original.id).minutes)} мин` }}
                </p>
              </div>
            </template>

            <template #commission-cell="{ row }">
              <span class="font-semibold text-charcoal-950">
                {{ formatMoney(profitShareForDraft(getEmployeeDraftWithCalculatedPenalty(row.original.id))) }}
              </span>
            </template>

            <template #payout-cell="{ row }">
              <span class="font-semibold text-primary-600">
                {{ formatMoney(payoutForDraft(getEmployeeDraftWithCalculatedPenalty(row.original.id))) }}
              </span>
            </template>
          </UTable>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
