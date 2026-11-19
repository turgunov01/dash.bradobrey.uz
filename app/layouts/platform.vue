<script setup lang="ts">
// Platform-owner shell: companies and platform-owner accounts only (no
// company data, MULTI_TENANCY D4).
const open = ref(false)
const platformSession = usePlatformSessionStore()

await platformSession.ensureLoaded()

const links = [
  { icon: 'i-lucide-building-2', label: 'Компании', to: '/platform/companies', onSelect: () => { open.value = false } },
  { icon: 'i-lucide-shield-user', label: 'Владельцы платформы', to: '/platform/owners', onSelect: () => { open.value = false } }
]

const initial = computed(() => (platformSession.user?.login || '?').charAt(0).toUpperCase())

async function logout() {
  await platformSession.logout()
  await navigateTo('/platform/login')
}
</script>

<template>
  <UDashboardGroup class="dashboard-shell" unit="rem">
    <UDashboardSidebar
      id="platform"
      v-model:open="open"
      collapsible
      class="bg-white/70 backdrop-blur-xl"
      :ui="{ footer: 'lg:border-t lg:border-default/70', header: 'h-auto py-3' }"
    >
      <template #header="{ collapsed }">
        <div class="flex w-full items-center gap-3" :class="collapsed && 'justify-center'">
          <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-charcoal-950 text-sand-50 shadow-sm">
            <UIcon name="i-lucide-landmark" class="size-4.5" />
          </div>
          <div v-if="!collapsed" class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-highlighted">
              Bradobrey
            </p>
            <p class="truncate text-xs text-muted">
              Управление платформой
            </p>
          </div>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu :collapsed="collapsed" :items="links" orientation="vertical" tooltip class="mt-2" />
      </template>

      <template #footer="{ collapsed }">
        <div
          class="flex w-full items-center gap-2.5 rounded-lg border border-default/70 bg-elevated/50"
          :class="collapsed ? 'justify-center border-transparent bg-transparent p-0' : 'px-2.5 py-2'"
        >
          <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-charcoal-900 text-xs font-semibold text-sand-50">
            {{ initial }}
          </div>
          <div v-if="!collapsed" class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-highlighted">
              {{ platformSession.user?.login || 'Владелец' }}
            </p>
            <p class="truncate text-xs text-muted">
              Владелец платформы
            </p>
          </div>
          <UTooltip text="Выйти">
            <UButton aria-label="Выйти" color="neutral" icon="i-lucide-log-out" size="sm" variant="ghost" @click="logout" />
          </UTooltip>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
