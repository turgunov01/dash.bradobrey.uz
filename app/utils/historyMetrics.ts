import type { FlatServiceItem } from './services'

export type HistoryMetricsRange = {
  endDate?: string | null
  startDate?: string | null
}

export type HistoryMetricsSummary = {
  completed: number
  orders: number
  revenue: number
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()

  return text || null
}

function normalizeNumber(value: unknown) {
  const amount = Number(value)

  return Number.isFinite(amount) ? amount : 0
}

function toNumberOrNull(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const amount = Number(value)

  return Number.isFinite(amount) ? amount : null
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]
}

function getServicePrice(service?: FlatServiceItem | Record<string, any> | null) {
  return Math.max(0, normalizeNumber(service?.base_price ?? service?.price ?? service?.amount))
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

function getPaymentAmount(item: Record<string, any>) {
  if (!Array.isArray(item.payments)) {
    return null
  }

  const amount = item.payments.reduce((sum: number, payment: Record<string, any>) => {
    const paymentAmount = toNumberOrNull(payment?.amount)

    return paymentAmount === null || paymentAmount <= 0 ? sum : sum + paymentAmount
  }, 0)

  return amount > 0 ? amount : null
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

    if (amount !== null && amount > 0) {
      return amount
    }
  }

  return getPaymentAmount(item)
}

export function extractHistoryItems(response: unknown): Record<string, any>[] {
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

export function createServicePriceMap(services: Array<FlatServiceItem | Record<string, any>>) {
  const priceByServiceId = new Map<string, number>()

  for (const service of services) {
    const id = normalizeText(service?.id)

    if (id) {
      priceByServiceId.set(id, getServicePrice(service))
    }
  }

  return priceByServiceId
}

export function getHistoryAmount(item: Record<string, any>, priceByServiceId: Map<string, number>) {
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

  return getHistoryServiceIds(item).reduce((sum, serviceId) => sum + (priceByServiceId.get(serviceId) ?? 0), 0)
}

export function normalizeHistoryStatus(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

export function isCompletedHistoryStatus(value: unknown) {
  return ['completed', 'complete', 'done', 'paid', 'finished'].includes(normalizeHistoryStatus(value))
}

export function getHistoryDateKey(item: Record<string, any>) {
  const value = normalizeText(
    item.completed_at
    || item.completedAt
    || item.finished_at
    || item.finishedAt
    || item.updated_at
    || item.updatedAt
    || item.created_at
    || item.createdAt
  )

  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

export function isHistoryInDateRange(item: Record<string, any>, range: HistoryMetricsRange) {
  const dateKey = getHistoryDateKey(item)

  if (!dateKey) {
    return true
  }

  if (range.startDate && dateKey < range.startDate) {
    return false
  }

  if (range.endDate && dateKey > range.endDate) {
    return false
  }

  return true
}

export function summarizeHistoryMetrics(
  items: Record<string, any>[],
  priceByServiceId: Map<string, number>,
  range: HistoryMetricsRange = {}
): HistoryMetricsSummary {
  const filteredItems = items.filter(item => isHistoryInDateRange(item, range))
  const completedItems = filteredItems.filter(item => isCompletedHistoryStatus(item.status))
  const revenue = completedItems.reduce((sum, item) => sum + getHistoryAmount(item, priceByServiceId), 0)

  return {
    completed: completedItems.length,
    orders: filteredItems.length,
    revenue
  }
}
