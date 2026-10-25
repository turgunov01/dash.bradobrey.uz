<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()

const PRODUCTION_API_HOST = 'api.bradobrey.uz'

const config = useRuntimeConfig()

// Shows which backend this panel talks to, so a local build pointed at a
// local api is never mistaken for production.
const environment = computed(() => {
  const apiBase = String(config.public.apiBase || '')
  return apiBase.includes(PRODUCTION_API_HOST)
    ? { label: 'PROD', color: 'success' as const }
    : { label: 'LOCAL', color: 'warning' as const }
})
</script>

<template>
  <div class="flex w-full items-center gap-3" :class="collapsed && 'justify-center'">
    <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-charcoal-950 text-sand-50 shadow-sm">
      <UIcon name="i-lucide-scissors" class="size-4.5" />
    </div>

    <div v-if="!collapsed" class="min-w-0 flex-1">
      <p class="truncate text-sm font-semibold text-highlighted">
        Bradobrey
      </p>
      <div class="flex items-center gap-1.5">
        <span class="truncate text-xs text-muted">Админ-панель</span>
        <UBadge :color="environment.color" :label="environment.label" size="sm" variant="subtle" class="shrink-0 px-1.5 py-0 text-[10px] font-semibold" />
      </div>
    </div>
  </div>
</template>
