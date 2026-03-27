<script setup lang="ts">
type PieSlice = {
  label: string
  value: number
  color?: string
  displayValue?: string
}

const props = defineProps<{
  items: PieSlice[]
  size?: number
  thickness?: number
  emptyLabel?: string
  totalLabel?: string
  centerLabel?: string
  centerValue?: string
  showLegend?: boolean
}>()

const palette = [
  '#22c55e',
  '#f59e0b',
  '#0ea5e9',
  '#6366f1',
  '#ef4444',
  '#14b8a6',
  '#a855f7',
  '#f97316',
  '#475569'
]

const sizePx = computed(() => props.size ?? 220)
const thicknessPx = computed(() => props.thickness ?? 26)
const innerSize = computed(() => Math.max(0, sizePx.value - thicknessPx.value * 2))

const total = computed(() =>
  props.items.reduce((sum, item) => sum + Math.max(0, item.value), 0)
)

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return '0'
  }

  if (Math.abs(value) >= 1000) {
    return value.toLocaleString('ru-RU')
  }

  return String(Math.round((value + Number.EPSILON) * 100) / 100)
}

const slices = computed(() => {
  let cursor = 0
  const totalValue = total.value

  const normalized = props.items
    .map((item, index) => ({
      ...item,
      color: item.color || palette[index % palette.length],
      value: Math.max(0, item.value)
    }))
    .filter(item => item.value > 0)

  return normalized.map((item) => {
    const percent = totalValue ? (item.value / totalValue) * 100 : 0
    const start = cursor
    cursor += percent

    return {
      ...item,
      percent,
      start,
      end: start + percent,
      displayValue: item.displayValue ?? formatNumber(item.value)
    }
  })
})

const gradient = computed(() => {
  if (!slices.value.length || total.value === 0) {
    return 'conic-gradient(#e5e7eb 0deg 360deg)'
  }

  const parts = slices.value
    .map(slice => `${slice.color} ${slice.start}% ${slice.end}%`)
    .join(', ')

  return `conic-gradient(${parts})`
})

const hasData = computed(() => total.value > 0 && slices.value.length > 0)
const centerValue = computed(() => props.centerValue ?? formatNumber(total.value))
const centerLabel = computed(() => props.centerLabel ?? props.totalLabel ?? 'Всего')
const showLegend = computed(() => props.showLegend !== false)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-center">
      <div
        class="relative"
        :style="{ width: `${sizePx}px`, height: `${sizePx}px` }"
      >
        <div
          class="h-full w-full rounded-full shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
          :style="{ backgroundImage: gradient, backgroundColor: '#f8fafc' }"
        />

        <div
          class="absolute inset-0 flex items-center justify-center"
        >
          <div
            class="flex flex-col items-center justify-center rounded-full bg-white/95 text-center shadow-sm"
            :style="{ width: `${innerSize}px`, height: `${innerSize}px` }"
          >
            <p v-if="centerLabel" class="text-[11px] uppercase tracking-[0.16em] text-charcoal-500">
              {{ centerLabel }}
            </p>
            <p class="text-xl font-semibold text-charcoal-950">
              {{ centerValue }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showLegend && hasData" class="space-y-2">
      <div
        v-for="slice in slices"
        :key="`${slice.label}-${slice.displayValue}`"
        class="flex items-center justify-between gap-3 rounded-xl border border-charcoal-100 bg-white/80 px-3 py-2"
      >
        <div class="flex items-center gap-2">
          <span class="size-3 rounded-full" :style="{ backgroundColor: slice.color }" />
          <span class="text-sm text-charcoal-700">{{ slice.label }}</span>
        </div>
        <span class="text-sm font-semibold text-charcoal-950">
          {{ slice.percent.toFixed(1) }}% · {{ slice.displayValue }}
        </span>
      </div>
    </div>

    <p v-else-if="!hasData" class="text-sm leading-6 text-charcoal-500">
      {{ emptyLabel || 'Нет данных для диаграммы' }}
    </p>
  </div>
</template>
