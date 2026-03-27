<script setup lang="ts">
import type { Branch } from '~~/shared/schemas'
import type { FlatServiceItem } from '~/utils/services'

import ChartDoughnut from '~/components/shared/ChartDoughnut.vue'
import { formatCount, formatMoney, formatPercent } from '~/utils/format'
import { formatPaymentMethod, formatScopeLabel } from '~/utils/display'
import { flattenServicesPayload } from '~/utils/services'

type Scope = 'barber' | 'branch' | 'global'

type BarberAccount = {
  branch_id: string | null
  id: string
  login: string | null
  role: string | null
}

type BarberOption = {
  branchId: string | null
  branchName: string | null
  label: string
  login: string | null
  value: string
}

type BreakdownRow = {
  cancelled: number
  completionRate: number
  count: number
  id: string
  label: string
  revenue: number
  uniqueClients: number
}

type PaymentBreakdownRow = {
  count: number
  key: string
  label: string
  percent: number
  revenue: number
}

type ServiceBreakdownRow = {
  avgPrice: number
  category: string
  completed: number
  count: number
  id: string
  label: string
  revenue: number
}

type TimelineRow = {
  cancelled: number
  completed: number
  dateKey: string
  label: string
}

type PieSlice = {
  color?: string
  displayValue: string
  label: string
  value: number
}

const chartColors = ['#22c55e', '#f59e0b', '#0ea5e9', '#6366f1', '#ef4444', '#14b8a6', '#a855f7', '#f97316', '#475569']

type NormalizedHistoryEntry = {
  actualServiceMinutes: number | null
  barberId: string | null
  barberName: string | null
  branchId: string | null
  branchName: string
  clientPhone: string | null
  createdAt: string | null
  createdTimestamp: number | null
  estimatedRevenue: number
  estimatedServiceMinutes: number
  finishedAt: string | null
  finishedTimestamp: number | null
  id: string
  isCancelled: boolean
  isCompleted: boolean
  paymentMethod: string | null
  primaryTimestamp: number | null
  serviceIds: string[]
  status: string
}

function extractHistoryItems(response: unknown): Record<string, any>[] {
  if (Array.isArray(response)) {
    return response as Record<string, any>[]
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    data?: Record<string, any>[] | { items?: Record<string, any>[] }
    items?: Record<string, any>[]
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.data?.items)) {
    return payload.data.items
  }

  return []
}

function extractBarberAccounts(response: unknown): BarberAccount[] {
  if (!response || typeof response !== 'object') {
    return []
  }

  const items = Array.isArray((response as { items?: unknown[] }).items)
    ? (response as { items: unknown[] }).items
    : []

  return items.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return []
    }

    const payload = item as Record<string, unknown>

    return [{
      branch_id: payload.branch_id == null ? null : String(payload.branch_id),
      id: String(payload.id || ''),
      login: normalizeText(payload.login),
      role: normalizeText(payload.role)
    }] satisfies BarberAccount[]
  }).filter(item => Boolean(item.id))
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()

  return text || null
}

function normalizeTimestamp(value: string | null | undefined) {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    return null
  }

  const trimmedFraction = normalizedValue.replace(/(\.\d{3})\d+/, '$1')
  const date = new Date(trimmedFraction)

  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

function parseRangeDate(value: string | null | undefined) {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    return null
  }

  const date = new Date(`${normalizedValue}T00:00:00`)

  return Number.isNaN(date.getTime()) ? null : date
}

function toDateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function shortId(value: string | null | undefined) {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    return 'неизвестно'
  }

  return normalizedValue.slice(0, 8)
}

function normalizeStatus(value: unknown) {
  return String(value || 'unknown').trim().toLowerCase()
}

function isCompletedStatus(status: string) {
  return ['completed', 'done', 'paid'].includes(status)
}

function isCancelledStatus(status: string) {
  return ['cancelled', 'no_show', 'not_in_time'].includes(status)
}

function getBranchId(item: Record<string, any>) {
  return normalizeText(item.branch_id || item.branch?.id)
}

function getBarberId(item: Record<string, any>) {
  return normalizeText(item.barber_id || item.barber?.id)
}

function getBarberName(item: Record<string, any>) {
  return normalizeText(item.barber?.name || item.barber_name || item.barber?.user?.name)
}

function getClientPhone(item: Record<string, any>) {
  return normalizeText(
    item.phone_number
    || item.phone
    || item.client?.phone
    || item.client?.phone_number
    || item.customer?.phone
  )
}

function getServiceIds(item: Record<string, any>) {
  const values = Array.isArray(item.service_ids)
    ? item.service_ids
    : item.service_id
      ? [item.service_id]
      : []

  return values
    .map(value => normalizeText(value))
    .filter((value): value is string => Boolean(value))
}

function getServicePrice(service?: FlatServiceItem) {
  const amount = Number(service?.base_price ?? service?.price ?? 0)

  return Number.isFinite(amount) ? amount : 0
}

function getServiceDuration(service?: FlatServiceItem) {
  const amount = Number(service?.duration_minutes ?? service?.duration ?? 0)

  return Number.isFinite(amount) ? amount : 0
}

function average(values: number[]) {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function formatMinutes(value: number) {
  const amount = Math.max(0, Math.round(value))

  return `${formatCount(amount)} мин`
}

const shortDayFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short'
})

const branchStore = useBranchStore()
const barbersApi = useBarbersApi()
const historyApi = useHistoryApi()
const kioskApi = useKioskApi()
const uiStore = useUiStore()

const scope = ref<Scope>('global')
const selectedBarberId = ref('')

await branchStore.ensureLoaded()

const { data, pending, refresh } = await useAsyncData('statistics-dashboard-rich', async () => {
  const [historyResult, servicesResult, barbersResult] = await Promise.allSettled([
    historyApi.list(),
    kioskApi.services({ active: true, grouped: true }),
    barbersApi.list()
  ])

  return {
    barberAccounts: barbersResult.status === 'fulfilled'
      ? extractBarberAccounts(barbersResult.value)
      : [] as BarberAccount[],
    historyItems: historyResult.status === 'fulfilled'
      ? extractHistoryItems(historyResult.value)
      : [] as Record<string, any>[],
    services: servicesResult.status === 'fulfilled'
      ? flattenServicesPayload(servicesResult.value)
      : [] as FlatServiceItem[]
  }
})

const serviceMap = computed<Map<string, FlatServiceItem>>(() =>
  new Map<string, FlatServiceItem>(
    (data.value?.services || []).map((service): [string, FlatServiceItem] => [String(service.id), service])
  )
)

const branchMap = computed<Map<string, Branch>>(() =>
  new Map<string, Branch>(
    branchStore.branches.map((branch: Branch): [string, Branch] => [branch.id, branch])
  )
)

const normalizedHistory = computed<NormalizedHistoryEntry[]>(() =>
  (data.value?.historyItems || []).map((item, index) => {
    const createdAt = normalizeText(item.created_at || item.createdAt)
    const finishedAt = normalizeText(item.finished_at || item.completed_at || item.finishedAt || item.completedAt)
    const createdTimestamp = normalizeTimestamp(createdAt)
    const finishedTimestamp = normalizeTimestamp(finishedAt)
    const branchId = getBranchId(item)
    const barberId = getBarberId(item)
    const barberName = getBarberName(item)
    const clientPhone = getClientPhone(item)
    const serviceIds = getServiceIds(item)
    const status = normalizeStatus(item.status)
    const estimatedRevenue = serviceIds.reduce((sum, serviceId) => {
      return sum + getServicePrice(serviceMap.value.get(serviceId))
    }, 0)
    const estimatedServiceMinutes = serviceIds.reduce((sum, serviceId) => {
      return sum + getServiceDuration(serviceMap.value.get(serviceId))
    }, 0)

    let actualServiceMinutes: number | null = null

    if (createdTimestamp !== null && finishedTimestamp !== null && finishedTimestamp >= createdTimestamp) {
      const diffMinutes = (finishedTimestamp - createdTimestamp) / 60000

      if (diffMinutes > 0 && diffMinutes <= 360) {
        actualServiceMinutes = diffMinutes
      }
    }

    const fallbackId = [
      createdAt || finishedAt || 'history',
      branchId || 'branch',
      barberId || 'barber',
      clientPhone || 'client',
      serviceIds.join(',') || `item-${index + 1}`
    ].join(':')

    return {
      actualServiceMinutes,
      barberId,
      barberName,
      branchId,
      branchName: branchId
        ? branchMap.value.get(branchId)?.name || `Филиал ${shortId(branchId)}`
        : 'Филиал не указан',
      clientPhone,
      createdAt,
      createdTimestamp,
      estimatedRevenue,
      estimatedServiceMinutes,
      finishedAt,
      finishedTimestamp,
      id: String(item.id || fallbackId),
      isCancelled: isCancelledStatus(status),
      isCompleted: isCompletedStatus(status),
      paymentMethod: normalizeText(item.payment_method),
      primaryTimestamp: createdTimestamp ?? finishedTimestamp,
      serviceIds,
      status
    }
  }).filter(item => Boolean(item.id))
)

const barberOptions = computed<BarberOption[]>(() => {
  const options = new Map<string, BarberOption>()

  for (const account of data.value?.barberAccounts || []) {
    const branchId = normalizeText(account.branch_id)
    const branchName = branchId ? branchMap.value.get(branchId)?.name || null : null

    options.set(account.id, {
      branchId,
      branchName,
      label: account.login || `Барбер ${shortId(account.id)}`,
      login: account.login,
      value: account.id
    })
  }

  for (const item of normalizedHistory.value) {
    if (!item.barberId) {
      continue
    }

    const existing = options.get(item.barberId)
    const branchId = existing?.branchId || item.branchId || null
    const branchName = existing?.branchName || item.branchName || null
    const label = item.barberName || existing?.label || `Барбер ${shortId(item.barberId)}`

    options.set(item.barberId, {
      branchId,
      branchName,
      label,
      login: existing?.login || null,
      value: item.barberId
    })
  }

  return [...options.values()].sort((left, right) => left.label.localeCompare(right.label, 'ru'))
})

watch(
  () => barberOptions.value.map(option => option.value),
  (ids) => {
    if (!ids.length) {
      selectedBarberId.value = ''
      return
    }

    if (!ids.includes(selectedBarberId.value)) {
      selectedBarberId.value = ids[0] || ''
    }
  },
  { immediate: true }
)

const selectedBarber = computed(() =>
  barberOptions.value.find(option => option.value === selectedBarberId.value) || null
)

const selectedRange = computed(() => {
  const start = parseRangeDate(uiStore.statisticsRange.start)
  const end = parseRangeDate(uiStore.statisticsRange.end)

  if (!start || !end) {
    return null
  }

  if (start.getTime() <= end.getTime()) {
    return {
      end: end.getTime() + 86399999,
      start: start.getTime()
    }
  }

  return {
    end: start.getTime() + 86399999,
    start: end.getTime()
  }
})

const selectedPeriodDays = computed(() => {
  if (!selectedRange.value) {
    return 0
  }

  return Math.max(1, Math.round((selectedRange.value.end - selectedRange.value.start) / 86400000))
})

const needsBranchSelection = computed(() =>
  scope.value === 'branch' && !branchStore.activeBranchId
)

const needsBarberSelection = computed(() =>
  scope.value === 'barber' && !selectedBarberId.value
)

const scopeHistory = computed(() => {
  return normalizedHistory.value.filter((item) => {
    if (scope.value === 'branch') {
      return Boolean(branchStore.activeBranchId) && item.branchId === branchStore.activeBranchId
    }

    if (scope.value === 'barber') {
      return Boolean(selectedBarberId.value) && item.barberId === selectedBarberId.value
    }

    return true
  })
})

const filteredHistory = computed(() => {
  if (!selectedRange.value) {
    return [] as NormalizedHistoryEntry[]
  }

  return scopeHistory.value.filter((item) => {
    if (item.primaryTimestamp === null) {
      return false
    }

    return item.primaryTimestamp >= selectedRange.value!.start
      && item.primaryTimestamp <= selectedRange.value!.end
  }).sort((left, right) => (left.primaryTimestamp || 0) - (right.primaryTimestamp || 0))
})

const completedHistory = computed(() =>
  filteredHistory.value.filter(item => item.isCompleted)
)

const mainMetrics = computed(() => {
  const revenue = completedHistory.value.reduce((sum, item) => sum + item.estimatedRevenue, 0)
  const orders = filteredHistory.value.length
  const completed = completedHistory.value.length
  const averageCheck = completed ? revenue / completed : 0

  return {
    averageCheck,
    completed,
    orders,
    revenue
  }
})

const clientMetrics = computed(() => {
  const firstSeenByPhone = new Map<string, number>()

  for (const item of scopeHistory.value) {
    if (!item.clientPhone || item.primaryTimestamp === null) {
      continue
    }

    const currentFirstSeen = firstSeenByPhone.get(item.clientPhone)

    if (currentFirstSeen === undefined || item.primaryTimestamp < currentFirstSeen) {
      firstSeenByPhone.set(item.clientPhone, item.primaryTimestamp)
    }
  }

  const uniqueClientsInPeriod = new Map<string, number>()

  for (const item of filteredHistory.value) {
    if (!item.clientPhone || item.primaryTimestamp === null) {
      continue
    }

    const currentFirstSeen = uniqueClientsInPeriod.get(item.clientPhone)

    if (currentFirstSeen === undefined || item.primaryTimestamp < currentFirstSeen) {
      uniqueClientsInPeriod.set(item.clientPhone, item.primaryTimestamp)
    }
  }

  let newClients = 0
  let repeatClients = 0

  for (const [phone, firstInPeriod] of uniqueClientsInPeriod.entries()) {
    const firstOverall = firstSeenByPhone.get(phone)

    if (firstOverall !== undefined && firstOverall < firstInPeriod) {
      repeatClients += 1
    }
    else {
      newClients += 1
    }
  }

  const uniqueClients = uniqueClientsInPeriod.size
  const completionRate = mainMetrics.value.orders
    ? (mainMetrics.value.completed / mainMetrics.value.orders) * 100
    : 0

  return {
    completionRate,
    newClients,
    repeatClients,
    uniqueClients
  }
})

const operationsMetrics = computed(() => {
  const cancelled = filteredHistory.value.filter(item => item.isCancelled).length
  const noShow = filteredHistory.value.filter(item => item.status === 'no_show').length
  const serviceMinutes = completedHistory.value
    .map((item) => {
      if (item.actualServiceMinutes !== null) {
        return item.actualServiceMinutes
      }

      return item.estimatedServiceMinutes > 0 ? item.estimatedServiceMinutes : null
    })
    .filter((value): value is number => value !== null && value > 0)
  const waitMinutes = completedHistory.value
    .map((item) => {
      if (item.actualServiceMinutes === null || item.estimatedServiceMinutes <= 0) {
        return null
      }

      return Math.max(item.actualServiceMinutes - item.estimatedServiceMinutes, 0)
    })
    .filter((value): value is number => value !== null)

  return {
    averageServiceMinutes: average(serviceMinutes),
    averageWaitMinutes: average(waitMinutes),
    cancelled,
    noShow
  }
})

const timelineRows = computed<TimelineRow[]>(() => {
  if (!selectedRange.value) {
    return []
  }

  const points = new Map<string, { cancelled: number, completed: number }>()

  for (let timestamp = selectedRange.value.start; timestamp <= selectedRange.value.end; timestamp += 86400000) {
    const dateKey = toDateKey(timestamp)

    points.set(dateKey, {
      cancelled: 0,
      completed: 0
    })
  }

  for (const item of filteredHistory.value) {
    if (item.primaryTimestamp === null) {
      continue
    }

    const dateKey = toDateKey(item.primaryTimestamp)
    const current = points.get(dateKey)

    if (!current) {
      continue
    }

    if (item.isCompleted) {
      current.completed += 1
    }

    if (item.isCancelled) {
      current.cancelled += 1
    }
  }

  return [...points.entries()].map(([dateKey, point]) => ({
    cancelled: point.cancelled,
    completed: point.completed,
    dateKey,
    label: shortDayFormatter.format(new Date(`${dateKey}T00:00:00`))
  }))
})

const branchBreakdown = computed<BreakdownRow[]>(() => {
  const rows = new Map<string, BreakdownRow & { completed: number, phones: Set<string> }>()

  for (const item of filteredHistory.value) {
    const id = item.branchId || 'unknown'
    const current = rows.get(id) || {
      cancelled: 0,
      completed: 0,
      completionRate: 0,
      count: 0,
      id,
      label: item.branchName || 'Филиал не указан',
      phones: new Set<string>(),
      revenue: 0,
      uniqueClients: 0
    }

    current.count += 1

    if (item.clientPhone) {
      current.phones.add(item.clientPhone)
    }

    if (item.isCompleted) {
      current.completed += 1
      current.revenue += item.estimatedRevenue
    }

    if (item.isCancelled) {
      current.cancelled += 1
    }

    rows.set(id, current)
  }

  return [...rows.values()]
    .map((row) => ({
      cancelled: row.cancelled,
      completionRate: row.count ? (row.completed / row.count) * 100 : 0,
      count: row.count,
      id: row.id,
      label: row.label,
      revenue: row.revenue,
      uniqueClients: row.phones.size
    }))
    .sort((left, right) => right.revenue - left.revenue || right.count - left.count)
})

const barberBreakdown = computed<BreakdownRow[]>(() => {
  const rows = new Map<string, BreakdownRow & { completed: number, phones: Set<string> }>()

  for (const item of filteredHistory.value) {
    const id = item.barberId || 'unknown'
    const current = rows.get(id) || {
      cancelled: 0,
      completed: 0,
      completionRate: 0,
      count: 0,
      id,
      label: item.barberName || `Барбер ${shortId(item.barberId)}`,
      phones: new Set<string>(),
      revenue: 0,
      uniqueClients: 0
    }

    current.count += 1

    if (item.clientPhone) {
      current.phones.add(item.clientPhone)
    }

    if (item.isCompleted) {
      current.completed += 1
      current.revenue += item.estimatedRevenue
    }

    if (item.isCancelled) {
      current.cancelled += 1
    }

    rows.set(id, current)
  }

  return [...rows.values()]
    .map((row) => ({
      cancelled: row.cancelled,
      completionRate: row.count ? (row.completed / row.count) * 100 : 0,
      count: row.count,
      id: row.id,
      label: row.label,
      revenue: row.revenue,
      uniqueClients: row.phones.size
    }))
    .sort((left, right) => right.revenue - left.revenue || right.count - left.count)
})

const serviceBreakdown = computed<ServiceBreakdownRow[]>(() => {
  const rows = new Map<string, ServiceBreakdownRow>()

  for (const item of filteredHistory.value) {
    for (const serviceId of item.serviceIds) {
      const service = serviceMap.value.get(serviceId)
      const current = rows.get(serviceId) || {
        avgPrice: 0,
        category: normalizeText(service?.category_name || service?.category) || 'Без категории',
        completed: 0,
        count: 0,
        id: serviceId,
        label: normalizeText(service?.name) || `Услуга ${shortId(serviceId)}`,
        revenue: 0
      }

      current.count += 1

      if (item.isCompleted) {
        current.completed += 1
        current.revenue += getServicePrice(service)
      }

      rows.set(serviceId, current)
    }
  }

  return [...rows.values()]
    .map(row => ({
      ...row,
      avgPrice: row.completed ? row.revenue / row.completed : row.revenue / Math.max(row.count, 1)
    }))
    .sort((left, right) => right.count - left.count || right.revenue - left.revenue)
})

const paymentBreakdown = computed<PaymentBreakdownRow[]>(() => {
  const rows = new Map<string, PaymentBreakdownRow>()

  for (const item of filteredHistory.value) {
    const key = normalizeText(item.paymentMethod) || 'pending'
    const current = rows.get(key) || {
      count: 0,
      key,
      label: formatPaymentMethod(key),
      percent: 0,
      revenue: 0
    }

    current.count += 1
    current.revenue += item.estimatedRevenue

    rows.set(key, current)
  }

  return [...rows.values()]
    .map(row => ({
      ...row,
      percent: filteredHistory.value.length ? (row.count / filteredHistory.value.length) * 100 : 0
    }))
    .sort((left, right) => right.count - left.count || right.revenue - left.revenue)
})

function toPieSlices<T>(
  rows: T[],
  getLabel: (row: T) => string,
  getValue: (row: T) => number,
  formatValue: (value: number) => string
): PieSlice[] {
  const maxSlices = 8
  const items = rows
    .map(row => ({
      label: getLabel(row),
      value: Math.max(0, getValue(row)),
      displayValue: formatValue(Math.max(0, getValue(row)))
    }))
    .filter(item => item.value > 0)

  if (items.length <= maxSlices) {
    return items
  }

  const head = items.slice(0, maxSlices - 1)
  const tail = items.slice(maxSlices - 1)
  const restValue = tail.reduce((sum, item) => sum + item.value, 0)

  return restValue > 0
    ? [...head, { label: 'Р”СЂСѓРіРёРµ', value: restValue, displayValue: formatValue(restValue) }]
    : head
}

const statusPieItems = computed<PieSlice[]>(() => {
  const completed = filteredHistory.value.filter(item => item.isCompleted).length
  const cancelled = filteredHistory.value.filter(item => item.isCancelled).length

  return [
    { label: 'Р—Р°РІРµСЂС€РµРЅРѕ', value: completed, displayValue: formatCount(completed), color: '#22c55e' },
    { label: 'РћС‚РєР°Р·С‹', value: cancelled, displayValue: formatCount(cancelled), color: '#f59e0b' }
  ].filter(item => item.value > 0)
})

const branchPieItems = computed<PieSlice[]>(() =>
  toPieSlices(branchBreakdown.value, row => row.label, row => row.count, formatCount)
)

const barberPieItems = computed<PieSlice[]>(() =>
  toPieSlices(barberBreakdown.value, row => row.label, row => row.count, formatCount)
)

const servicePieItems = computed<PieSlice[]>(() =>
  toPieSlices(serviceBreakdown.value, row => row.count ? `${row.label}` : row.label, row => row.count, formatCount)
    .map((item, index) => ({
      ...item,
      color: item.color ?? chartColors[index % chartColors.length]
    }))
)

const paymentPieItems = computed<PieSlice[]>(() =>
  toPieSlices(paymentBreakdown.value, row => row.label, row => row.count, formatCount)
)

const serviceChartData = computed<{
  labels: string[]
  dataset: { data: number[]; backgroundColor: string[] }
}>(() => {
  const items = servicePieItems.value
  return {
    labels: items.map(item => item.label),
    dataset: {
      data: items.map(item => item.value),
      backgroundColor: items.map(item => item.color as string)
    }
  }
})

const mainStatusChartData = computed(() => {
  const orders = Math.max(0, mainMetrics.value.orders)
  const completed = Math.max(0, mainMetrics.value.completed)
  const notCompleted = Math.max(orders - completed, 0)
  const labels = ['Завершено', 'Не завершено']
  const backgroundColor = ['#22c55e', '#ef4444']
  const tooltipLabels = [
    `Завершено: ${formatCount(completed)} · ${formatPercent(orders ? (completed / orders) * 100 : 0)} · ${formatMoney(mainMetrics.value.revenue)}`,
    `Не завершено: ${formatCount(notCompleted)}`
  ]

  return {
    labels,
    dataset: {
      data: [completed, notCompleted],
      backgroundColor
    },
    tooltipLabels
  }
})

const clientChartData = computed(() => {
  const newClients = Math.max(0, clientMetrics.value.newClients)
  const repeatClients = Math.max(0, clientMetrics.value.repeatClients)
  const labels = ['Новые', 'Повторные']
  const backgroundColor = ['#0ea5e9', '#a855f7']
  const tooltipLabels = [
    `Новые: ${formatCount(newClients)}`,
    `Повторные: ${formatCount(repeatClients)}`
  ]

  return {
    labels,
    dataset: {
      data: [newClients, repeatClients],
      backgroundColor
    },
    tooltipLabels
  }
})

const topBranches = computed(() => branchBreakdown.value.slice(0, 3))
const topBarbers = computed(() => barberBreakdown.value.slice(0, 3))
const topServices = computed(() => serviceBreakdown.value.slice(0, 3))

const primaryKpiCards = computed(() => [
  {
    description: 'Оценка по стоимости услуг в завершённых записях.',
    icon: 'i-lucide-wallet',
    label: 'Выручка',
    value: formatMoney(mainMetrics.value.revenue)
  },
  {
    description: 'Все записи за выбранный период и область.',
    icon: 'i-lucide-ticket',
    label: 'Заказы',
    value: formatCount(mainMetrics.value.orders)
  },
  {
    description: 'Записи со статусом завершения.',
    icon: 'i-lucide-check-check',
    label: 'Завершено',
    value: formatCount(mainMetrics.value.completed)
  },
  {
    description: 'Выручка, делённая на число завершённых записей.',
    icon: 'i-lucide-receipt',
    label: 'Средний чек',
    value: formatMoney(mainMetrics.value.averageCheck)
  }
])

const supportingKpiCards = computed(() => [
  {
    description: 'Уникальные номера телефона в выбранном периоде.',
    icon: 'i-lucide-users-round',
    label: 'Всего клиентов',
    value: formatCount(clientMetrics.value.uniqueClients)
  },
  {
    description: 'Новые и повторные клиенты в рамках выбранной области.',
    icon: 'i-lucide-repeat-2',
    label: 'Новые / повторные',
    value: `${formatCount(clientMetrics.value.newClients)} / ${formatCount(clientMetrics.value.repeatClients)}`
  },
  {
    description: 'Доля завершённых записей от общего числа заказов.',
    icon: 'i-lucide-gauge',
    label: 'Completion rate',
    value: formatPercent(clientMetrics.value.completionRate)
  }
])

const operationsCards = computed(() => [
  {
    description: 'Статусы cancelled, no_show и not_in_time.',
    icon: 'i-lucide-ban',
    label: 'Отмены',
    value: formatCount(operationsMetrics.value.cancelled)
  },
  {
    description: 'Отдельно по статусу no_show.',
    icon: 'i-lucide-user-x',
    label: 'No-show',
    value: formatCount(operationsMetrics.value.noShow)
  },
  {
    description: 'Приближение: фактический цикл минус длительность услуг.',
    icon: 'i-lucide-hourglass',
    label: 'Среднее ожидание',
    value: formatMinutes(operationsMetrics.value.averageWaitMinutes)
  },
  {
    description: 'По completed-записям, от created_at до finished_at.',
    icon: 'i-lucide-timer',
    label: 'Среднее обслуживание',
    value: formatMinutes(operationsMetrics.value.averageServiceMinutes)
  }
])

const scopeContextLabel = computed(() => {
  if (scope.value === 'branch') {
    return branchStore.activeBranch?.name || 'Филиал не выбран'
  }

  if (scope.value === 'barber') {
    return selectedBarber.value?.label || 'Барбер не выбран'
  }

  return 'Все филиалы'
})
</script>

<template>
  <UDashboardPanel id="statistics">
    <template #header>
      <UDashboardNavbar title="Статистика" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <template #header>
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Настройка среза
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  Бизнес-аналитика по истории записей
                </h2>
                <p class="text-sm text-charcoal-500">
                  Выручка и средний чек считаются по прайсу услуг в завершённых записях, так как backend не отдаёт отдельное поле revenue.
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <UBadge color="neutral" size="lg" variant="soft">
                  {{ formatScopeLabel(scope) }}
                </UBadge>
                <UBadge color="neutral" variant="outline">
                  {{ scopeContextLabel }}
                </UBadge>
                <UBadge color="neutral" variant="outline">
                  {{ formatCount(filteredHistory.length) }} записей
                </UBadge>
              </div>
            </div>
          </template>

          <div class="grid gap-4 xl:grid-cols-[0.26fr_0.26fr_0.18fr_0.3fr]">
            <UFormField label="Дата начала">
              <UInput v-model="uiStore.statisticsRange.start" type="date" />
            </UFormField>

            <UFormField label="Дата окончания">
              <UInput v-model="uiStore.statisticsRange.end" type="date" />
            </UFormField>

            <UFormField label="Область">
              <USelectMenu
                v-model="scope"
                :items="[
                  { label: 'Общая', value: 'global' },
                  { label: 'Филиал', value: 'branch' },
                  { label: 'Барбер', value: 'barber' }
                ]"
                value-key="value"
              />
            </UFormField>

            <UFormField v-if="scope === 'barber'" label="Барбер">
              <USelectMenu v-model="selectedBarberId" :items="barberOptions" value-key="value" />
            </UFormField>
          </div>
        </UCard>

        <SharedEmptyState
          v-if="needsBranchSelection"
          description="Для режима филиала выберите branch через BranchSelector в левой панели."
          icon="i-lucide-map-pinned"
          title="Филиал не выбран"
        />

        <SharedEmptyState
          v-else-if="needsBarberSelection"
          description="Не найдено ни одного барбера для построения персональной статистики."
          icon="i-lucide-user-round-search"
          title="Барбер не выбран"
        />

        <template v-else>
          <div class="grid gap-4 md:grid-cols-2">
            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <div class="flex flex-col gap-6">
                <div class="space-y-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Выполнение
                  </p>
                  <h2 class="barbershop-heading text-3xl text-charcoal-950">
                    Завершение заказов
                  </h2>
                  <div class="flex flex-wrap items-center gap-2 text-sm text-charcoal-600">
                    <UBadge color="neutral" variant="soft">
                      Всего {{ formatCount(mainMetrics.orders) }}
                    </UBadge>
                    <UBadge color="neutral" variant="outline">
                      Завершено {{ formatCount(mainMetrics.completed) }}
                    </UBadge>
                    <span class="text-charcoal-500">
                      Выручка в подсказке на графике
                    </span>
                  </div>
                </div>

                <div class="flex w-full justify-center lg:w-auto">
                  <ChartDoughnut
                    :dataset="mainStatusChartData.dataset"
                    :labels="mainStatusChartData.labels"
                    :tooltip-labels="mainStatusChartData.tooltipLabels"
                    title="Завершено / не завершено"
                  />
                </div>
              </div>
            </UCard>

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <div class="flex flex-col gap-6">
                <div class="space-y-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Клиенты
                  </p>
                  <h2 class="barbershop-heading text-3xl text-charcoal-950">
                    Новые / повторные и completion
                  </h2>
                  <div class="flex flex-wrap items-center gap-2 text-sm text-charcoal-600">
                    <UBadge color="neutral" variant="soft">
                      Всего {{ formatCount(clientMetrics.uniqueClients) }}
                    </UBadge>
                    <UBadge color="neutral" variant="outline">
                      Completion {{ formatPercent(clientMetrics.completionRate) }}
                    </UBadge>
                  </div>
                </div>

                <div class="flex w-full justify-center lg:w-auto">
                  <ChartDoughnut
                    :dataset="clientChartData.dataset"
                    :labels="clientChartData.labels"
                    :tooltip-labels="clientChartData.tooltipLabels"
                    title="Клиенты"
                  />
                </div>
              </div>
            </UCard>
          </div>

          <div class="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            <DashboardMetricCard
              v-for="card in operationsCards"
              :key="card.label"
              :description="card.description"
              :icon="card.icon"
              :label="card.label"
              :value="card.value"
            />
          </div>

          <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
            <template #header>
              <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Динамика
                  </p>
                  <h2 class="barbershop-heading text-3xl text-charcoal-950">
                    Завершённые заказы и отказы по дням
                  </h2>
                </div>

                <div class="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-charcoal-500">
                  <div class="flex items-center gap-2">
                    <span class="size-3 rounded-full bg-emerald-400" />
                    Завершено
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="size-3 rounded-full bg-amber-400" />
                    Отказы
                  </div>
                  <UBadge color="neutral" variant="outline">
                    {{ formatCount(selectedPeriodDays) }} дн.
                  </UBadge>
                </div>
              </div>
            </template>

            <div v-if="filteredHistory.length" class="grid gap-6 xl:grid-cols-[0.55fr_0.45fr] items-center">
              <SharedPieChart
                :items="statusPieItems"
                center-label="Записи"
                empty-label="За выбранный диапазон нет записей."
                :size="260"
              />

              <div class="space-y-3 max-h-[24rem] overflow-auto pr-1">
                <div
                  v-for="point in timelineRows"
                  :key="point.dateKey"
                  class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/90 px-4 py-3"
                  :title="`${point.label}: ${formatCount(point.completed)} завершено, ${formatCount(point.cancelled)} отказов`"
                >
                  <div class="flex items-center gap-2 text-sm text-charcoal-700">
                    <span class="size-2.5 rounded-full bg-emerald-400" />
                    <span class="font-medium text-charcoal-950">{{ point.label }}</span>
                  </div>
                  <div class="flex items-center gap-3 text-sm font-semibold">
                    <span class="text-emerald-600">{{ formatCount(point.completed) }}</span>
                    <span class="text-charcoal-300">/</span>
                    <span class="text-amber-500">{{ formatCount(point.cancelled) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <SharedEmptyState
              v-else
              description="За выбранный диапазон нет записей для построения диаграммы статусов."
              icon="i-lucide-chart-no-axes-combined"
              title="Нет данных по периоду"
            />
          </UCard>

          <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Разбивка
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    По филиалам
                  </h2>
                </div>
              </template>

              <div v-if="branchBreakdown.length" class="space-y-6">
                <div class="flex justify-center">
                  <SharedPieChart
                    :items="branchPieItems"
                    center-label="Записи"
                    empty-label="Нет данных для диаграммы по филиалам"
                  />
                </div>

                <div class="space-y-3 max-h-[32rem] overflow-auto pr-1">
                  <div
                    v-for="row in branchBreakdown"
                    :key="row.id"
                    class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="space-y-1">
                        <p class="font-semibold text-charcoal-950">
                          {{ row.label }}
                        </p>
                        <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">
                          {{ formatCount(row.count) }} записей · {{ formatCount(row.uniqueClients) }} клиентов
                        </p>
                      </div>
                      <div class="space-y-1 text-right">
                        <p class="font-semibold text-charcoal-950">
                          {{ formatMoney(row.revenue) }}
                        </p>
                        <p class="text-xs text-charcoal-500">
                          Completion {{ formatPercent(row.completionRate) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <SharedEmptyState
                v-else
                description="Нет записей для группировки по филиалам."
                icon="i-lucide-map"
                title="Разбивка пуста"
              />
            </UCard>

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Разбивка
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    По барберам
                  </h2>
                </div>
              </template>

              <div v-if="barberBreakdown.length" class="space-y-6">
                <div class="flex justify-center">
                  <SharedPieChart
                    :items="barberPieItems"
                    center-label="Записи"
                    empty-label="Нет данных для диаграммы по барберам"
                  />
                </div>

                <div class="space-y-3 max-h-[32rem] overflow-auto pr-1">
                  <div
                    v-for="row in barberBreakdown"
                    :key="row.id"
                    class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="space-y-1">
                        <p class="font-semibold text-charcoal-950">
                          {{ row.label }}
                        </p>
                        <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">
                          {{ formatCount(row.count) }} записей · {{ formatCount(row.uniqueClients) }} клиентов
                        </p>
                      </div>
                      <div class="space-y-1 text-right">
                        <p class="font-semibold text-charcoal-950">
                          {{ formatMoney(row.revenue) }}
                        </p>
                        <p class="text-xs text-charcoal-500">
                          Completion {{ formatPercent(row.completionRate) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <SharedEmptyState
                v-else
                description="Нет записей для группировки по барберам."
                icon="i-lucide-scissors"
                title="Разбивка пуста"
              />
            </UCard>

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Разбивка
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    По услугам
                  </h2>
                </div>
              </template>

              <div v-if="serviceBreakdown.length" class="flex justify-center">
                <ChartDoughnut
                  :dataset="serviceChartData.dataset"
                  :labels="serviceChartData.labels"
                  title="Использования услуг"
                />
              </div>
              <SharedEmptyState
                v-else
                description="В истории нет услуг для разбивки."
                icon="i-lucide-badge-dollar-sign"
                title="Разбивка пуста"
              />
            </UCard>

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Разбивка
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    По способам оплаты
                  </h2>
                </div>
              </template>

              <div v-if="paymentBreakdown.length" class="space-y-6">
                <div class="flex justify-center">
                  <SharedPieChart
                    :items="paymentPieItems"
                    center-label="Записи"
                    empty-label="Нет данных по оплате"
                  />
                </div>

                <div class="space-y-3">
                  <div
                    v-for="row in paymentBreakdown"
                    :key="row.key"
                    class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="space-y-1">
                        <p class="font-semibold text-charcoal-950">
                          {{ row.label }}
                        </p>
                        <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">
                          {{ formatCount(row.count) }} записей · {{ formatPercent(row.percent) }}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-semibold text-charcoal-950">
                          {{ formatMoney(row.revenue) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <SharedEmptyState
                v-else
                description="Не найдено ни одного способа оплаты."
                icon="i-lucide-credit-card"
                title="Разбивка пуста"
              />
            </UCard>
          </div>

          <div class="grid gap-6 xl:grid-cols-3">
            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Top-лист
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    Лучшие филиалы
                  </h2>
                </div>
              </template>

              <div v-if="topBranches.length" class="space-y-3">
                <div
                  v-for="(row, index) in topBranches"
                  :key="row.id"
                  class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex size-9 items-center justify-center rounded-2xl bg-brass-100 font-semibold text-brass-800">
                      {{ index + 1 }}
                    </div>
                    <div class="space-y-1">
                      <p class="font-semibold text-charcoal-950">
                        {{ row.label }}
                      </p>
                      <p class="text-xs text-charcoal-500">
                        {{ formatCount(row.count) }} записей
                      </p>
                    </div>
                  </div>
                  <p class="font-semibold text-charcoal-950">
                    {{ formatMoney(row.revenue) }}
                  </p>
                </div>
              </div>
              <SharedEmptyState
                v-else
                description="Нет филиалов для ранжирования."
                icon="i-lucide-trophy"
                title="Top-лист пуст"
              />
            </UCard>

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Top-лист
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    Лучшие барберы
                  </h2>
                </div>
              </template>

              <div v-if="topBarbers.length" class="space-y-3">
                <div
                  v-for="(row, index) in topBarbers"
                  :key="row.id"
                  class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex size-9 items-center justify-center rounded-2xl bg-sand-100 font-semibold text-charcoal-900">
                      {{ index + 1 }}
                    </div>
                    <div class="space-y-1">
                      <p class="font-semibold text-charcoal-950">
                        {{ row.label }}
                      </p>
                      <p class="text-xs text-charcoal-500">
                        {{ formatCount(row.count) }} записей
                      </p>
                    </div>
                  </div>
                  <p class="font-semibold text-charcoal-950">
                    {{ formatMoney(row.revenue) }}
                  </p>
                </div>
              </div>
              <SharedEmptyState
                v-else
                description="Нет барберов для ранжирования."
                icon="i-lucide-award"
                title="Top-лист пуст"
              />
            </UCard>

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Top-лист
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    Частые услуги
                  </h2>
                </div>
              </template>

              <div v-if="topServices.length" class="space-y-3">
                <div
                  v-for="(row, index) in topServices"
                  :key="row.id"
                  class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex size-9 items-center justify-center rounded-2xl bg-charcoal-100 font-semibold text-charcoal-900">
                      {{ index + 1 }}
                    </div>
                    <div class="space-y-1">
                      <p class="font-semibold text-charcoal-950">
                        {{ row.label }}
                      </p>
                      <p class="text-xs text-charcoal-500">
                        {{ row.category }} · {{ formatCount(row.count) }} раз
                      </p>
                    </div>
                  </div>
                  <p class="font-semibold text-charcoal-950">
                    {{ formatMoney(row.revenue) }}
                  </p>
                </div>
              </div>
              <SharedEmptyState
                v-else
                description="Нет услуг для ранжирования."
                icon="i-lucide-list-ordered"
                title="Top-лист пуст"
              />
            </UCard>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
