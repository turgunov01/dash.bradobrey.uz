<script setup lang="ts">
defineProps<{
  label?: string
  value: unknown
}>()
</script>

<template>
  <UCard class="warm-card rounded-[1rem] border border-charcoal-200">
    <template v-if="label" #header>
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-charcoal-500">
        {{ label }}
      </p>
    </template>

    <pre class="overflow-auto text-xs leading-6 text-charcoal-700">{{ JSON.stringify(value, null, 2) }}</pre>
  </UCard>
</template>
