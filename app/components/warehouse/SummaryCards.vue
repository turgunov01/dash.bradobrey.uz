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

const { data: summaryData } = await useAsyncData('warehouse-summary', () => warehouseApi.summary(), {
  default: () => ({})
})

const summary = computed(() => {
  const source = summaryData.value && typeof summaryData.value === 'object'
    ? summaryData.value as Record<string, any>
    : {}
  const data = source.summary && typeof source.summary === 'object'
    ? source.summary as Record<string, any>
    : source

  return {
    lowStock: normalizeNumber(data.low_stock || data.lowStock || data.low_stock_count || data.low_stock_positions),
    positions: normalizeNumber(data.positions || data.positions_count || data.positionsCount),
    purchases: normalizeNumber(data.purchases || data.purchases_total || data.purchase_total || data.purchases_month_total),
    stockValue: normalizeNumber(data.stock_value || data.stockValue || data.total_stock_value),
    stocks: normalizeNumber(data.stocks || data.stocks_count || data.stocksCount)
  }
})

const positionsValue = computed(() => props.positionsCount ?? summary.value.positions)
const stocksValue = computed(() => props.stocksCount ?? summary.value.stocks)
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
    <DashboardMetricCard
      description="Количество складских позиций."
      icon="i-lucide-box"
      label="Позиции"
      :value="formatCount(positionsValue)"
    />
    <DashboardMetricCard
      description="Текущие строки остатков по филиалам."
      icon="i-lucide-warehouse"
      label="Остатки"
      :value="formatCount(stocksValue)"
    />
    <DashboardMetricCard
      description="Закупки за текущий месяц."
      icon="i-lucide-shopping-cart"
      label="Закупки"
      :value="formatMoney(summary.purchases)"
    />
    <DashboardMetricCard
      description="Оценочная стоимость остатков."
      icon="i-lucide-coins"
      label="Стоимость"
      :value="formatMoney(summary.stockValue)"
    />
    <DashboardMetricCard
      description="Позиции ниже минимального остатка."
      icon="i-lucide-triangle-alert"
      label="Низкий остаток"
      :value="formatCount(summary.lowStock)"
    />
  </div>
</template>
