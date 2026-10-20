<script setup lang="ts">
defineProps<{
  description?: string
  icon?: string
  label: string
  // While true the value (server data) is replaced by a skeleton; the static
  // label, icon and description stay visible so the layout does not jump.
  loading?: boolean
  value?: string | number | null
}>()
</script>

<template>
  <UCard class="warm-card rounded-[1rem] border border-charcoal-200" :aria-busy="loading || undefined">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1 space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
          {{ label }}
        </p>
        <USkeleton v-if="loading" class="h-8 w-28 rounded-md sm:h-9" />
        <p v-else class="barbershop-heading break-words text-2xl text-charcoal-950 sm:text-3xl">
          {{ value ?? '—' }}
        </p>
        <p v-if="description" class="text-sm leading-6 text-charcoal-500">
          {{ description }}
        </p>
      </div>

      <div v-if="icon" class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brass-100 text-brass-800">
        <UIcon :name="icon" class="size-5" />
      </div>
    </div>
  </UCard>
</template>
