<script setup lang="ts">
defineProps<{
  description?: string
  icon?: string
  label: string
  value: string | number
}>()
</script>

<template>
  <UCard class="warm-card rounded-[1.75rem] border border-charcoal-200">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
          {{ label }}
        </p>
        <p class="barbershop-heading break-words text-2xl text-charcoal-950 sm:text-3xl">
          {{ value }}
        </p>
        <p v-if="description" class="text-sm leading-6 text-charcoal-500">
          {{ description }}
        </p>
      </div>

      <div v-if="icon" class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brass-100 text-brass-800">
        <UIcon :name="icon" class="size-5" />
      </div>
    </div>
  </UCard>
</template>
