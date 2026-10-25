<script setup lang="ts">
defineProps<{
  description: string
  icon?: string
  title: string
}>()
</script>

<template>
  <UCard class="warm-card rounded-[1rem] border border-dashed border-charcoal-200">
    <div class="flex flex-col items-start gap-4">
      <div class="flex size-12 items-center justify-center rounded-xl bg-sand-100 text-brass-700">
        <UIcon :name="icon || 'i-lucide-package-open'" class="size-6" />
      </div>

      <div class="space-y-2">
        <h3 class="barbershop-heading text-2xl text-charcoal-950">
          {{ title }}
        </h3>
        <p class="max-w-xl text-sm leading-6 text-charcoal-500">
          {{ description }}
        </p>
      </div>

      <slot />
    </div>
  </UCard>
</template>
