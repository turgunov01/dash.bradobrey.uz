<script setup lang="ts">
import { formatCount, formatMoney } from '~/utils/format'

const props = defineProps<{
  positionsCount?: number
  stocksCount?: number
}>()

const warehouseApi = useWarehouseApi()

function normalizeNumber(value: unknown) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function extractItems(value: unknown): Record<string, any>[] {
  if (Array.isArray(value)) return value as Record<string, any>[]
  if (!value || typeof value !== 'object') return []

  const source = value as Record<string, any>
  for (const key of ['items', 'data', 'rows', 'records', 'positions', 'stocks']) {
    if (Array.isArray(source[key])) return source[key] as Record<string, any>[]
  }
  return source.data && typeof source.data === 'object' ? extractItems(source.data) : []
}

function hasNumberField(source: Record<string, any>, keys: string[]) {
  return keys.some(key => source[key] !== undefined && source[key] !== null)
}

const { data: summaryData, pending: summaryPending } = await useAsyncData('warehouse-summary', () => warehouseApi.summary(), {
  default: () => ({}),
  lazy: true
})

// The API summary was introduced after the list endpoints. Keep the cards
// accurate during a rolling backend deployment by deriving missing metrics from
// the same shared data used by the warehouse pages.
const { data: positionsData, pending: positionsPending } = await useAsyncData('warehouse-positions', () => warehouseApi.positions(), {
  default: () => ({ items: [] }),
  lazy: true
})
const { data: stocksData, pending: stocksPending } = await useAsyncData('warehouse-stocks', () => warehouseApi.stocks(), {
  default: () => ({ items: [] }),
  lazy: true
})

// `default` keeps data non-null, so first load = pending with nothing received yet.
const isInitialLoading = computed(() =>
  (summaryPending.value && !Object.keys(summaryData.value || {}).length)
  || (positionsPending.value && !extractItems(positionsData.value).length)
  || (stocksPending.value && !extractItems(stocksData.value).length)
)

const summary = computed(() => {
  const source = summaryData.value && typeof summaryData.value === 'object'
    ? summaryData.value as Record<string, any>
    : {}
  const data = source.summary && typeof source.summary === 'object'
    ? source.summary as Record<string, any>
    : source
  const positions = extractItems(positionsData.value)
  const stocks = extractItems(stocksData.value)
  const positionById = new Map(positions.map(position => [String(position.id), position]))
  const lowStock = stocks.filter((stock) => {
    const positionId = stock.position_id || stock.positionId || stock.position?.id
    const position = positionById.get(String(positionId))
    const quantity = normalizeNumber(stock.quantity || stock.qty || stock.amount)
    const minimum = normalizeNumber(position?.min_quantity || position?.minQuantity || stock.position?.min_quantity)
    return quantity <= minimum
  }).length

  return {
    lowStock: hasNumberField(data, ['low_stock', 'lowStock', 'low_stock_count', 'low_stock_positions'])
      ? normalizeNumber(data.low_stock || data.lowStock || data.low_stock_count || data.low_stock_positions)
      : lowStock,
    positions: hasNumberField(data, ['positions', 'positions_count', 'positionsCount'])
      ? normalizeNumber(data.positions || data.positions_count || data.positionsCount)
      : positions.length,
    purchases: normalizeNumber(data.purchases || data.purchases_total || data.purchase_total || data.purchases_month_total),
    stockValue: normalizeNumber(data.stock_value || data.stockValue || data.total_stock_value),
    stocks: hasNumberField(data, ['stocks', 'stocks_count', 'stocksCount'])
      ? normalizeNumber(data.stocks || data.stocks_count || data.stocksCount)
      : stocks.length
  }
})

const positionsValue = computed(() => props.positionsCount ?? summary.value.positions)
const stocksValue = computed(() => props.stocksCount ?? summary.value.stocks)
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
    <DashboardMetricCard
      :loading="isInitialLoading"
      description="Количество складских позиций."
      icon="i-lucide-box"
      label="Позиции"
      :value="formatCount(positionsValue)"
    />
    <DashboardMetricCard
      :loading="isInitialLoading"
      description="Текущие строки остатков по филиалам."
      icon="i-lucide-warehouse"
      label="Остатки"
      :value="formatCount(stocksValue)"
    />
    <DashboardMetricCard
      :loading="isInitialLoading"
      description="Закупки за текущий месяц."
      icon="i-lucide-shopping-cart"
      label="Закупки"
      :value="formatMoney(summary.purchases)"
    />
    <DashboardMetricCard
      :loading="isInitialLoading"
      description="Оценочная стоимость остатков."
      icon="i-lucide-coins"
      label="Стоимость"
      :value="formatMoney(summary.stockValue)"
    />
    <DashboardMetricCard
      :loading="isInitialLoading"
      description="Позиции ниже минимального остатка."
      icon="i-lucide-triangle-alert"
      label="Низкий остаток"
      :value="formatCount(summary.lowStock)"
    />
  </div>
</template>
