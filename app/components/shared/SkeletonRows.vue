<script setup lang="ts">
// Placeholder for tables and lists while server data is loading.
// Usage: <SharedSkeletonRows v-if="isInitialLoading" :rows="6" :columns="5" />
const props = withDefaults(defineProps<{
  rows?: number
  columns?: number
  // Render each row as a bordered card (for card lists) instead of a table row.
  card?: boolean
}>(), {
  rows: 5,
  columns: 4,
  card: false
})

// Vary widths so the placeholder reads like text, not a grid of bars.
const WIDTHS = ['w-2/3', 'w-1/2', 'w-3/4', 'w-2/5', 'w-1/3']

function widthFor(row: number, column: number) {
  return WIDTHS[(row + column) % WIDTHS.length]
}
</script>

<template>
  <div class="space-y-2" aria-busy="true" aria-label="Загрузка данных">
    <div
      v-for="row in props.rows"
      :key="row"
      class="grid items-center gap-4"
      :class="props.card ? 'rounded-[0.875rem] border border-charcoal-200 bg-white/70 px-4 py-3' : 'border-b border-default/60 px-1 py-3'"
      :style="{ gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))` }"
    >
      <USkeleton
        v-for="column in props.columns"
        :key="column"
        class="h-4 rounded"
        :class="widthFor(row, column)"
      />
    </div>
  </div>
</template>
