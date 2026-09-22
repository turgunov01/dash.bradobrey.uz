<script setup lang="ts">
import { formatStatusLabel } from '~/utils/display'

const props = defineProps<{
  label?: string | null
}>()

const color = computed(() => {
  const value = String(props.label || '').toLowerCase()

  if (['completed', 'done', 'paid', 'active', 'ready', 'success'].includes(value)) {
    return 'primary'
  }

  if (['pending', 'waiting', 'called', 'started', 'in_progress'].includes(value)) {
    return 'warning'
  }

  if (['cancelled', 'rejected', 'no_show', 'not_in_time', 'inactive', 'error'].includes(value)) {
    return 'error'
  }

  return 'neutral'
})
</script>

<template>
  <UBadge :color="color" variant="soft">
    {{ formatStatusLabel(label) }}
  </UBadge>
</template>
