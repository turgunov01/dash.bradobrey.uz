<script setup lang="ts">
const open = ref(false)
const sessionStore = useSessionStore()

const { primaryLinks, supportLinks } = useMerchantNavigation()

await sessionStore.ensureLoaded()

function closeSidebar() {
  open.value = false
}

const mainLinks = computed(() =>
  (primaryLinks[0] || []).map(item => ({
    ...item,
    onSelect: closeSidebar
  }))
)

const utilityLinks = computed(() =>
  (supportLinks[0] || []).map(item => ({
    ...item,
    onSelect: closeSidebar
  }))
)
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="merchant"
      v-model:open="open"
      collapsible
      resizable
      class="bg-white/70 backdrop-blur-xl"
      :ui="{
        footer: 'lg:border-t lg:border-default/70',
        header: 'border-b border-default/70'
      }"
    >
      <template #header="{ collapsed }">
        <div class="w-full">
          <div class="flex items-center gap-2 px-2 py-1">
            <div class="h-8 w-8 rounded-xl bg-brass-400/15" />
            <div v-if="!collapsed" class="min-w-0">
              <p class="text-sm font-semibold text-charcoal-950">
                Кабинет мерчанта
              </p>
              <p class="truncate text-xs text-charcoal-500">
                {{ sessionStore.user?.login || sessionStore.user?.name || 'Профиль' }}
              </p>
            </div>
          </div>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="mainLinks"
          class="mt-4"
          orientation="vertical"
          tooltip
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="utilityLinks"
          class="mt-auto"
          orientation="vertical"
          tooltip
        />
      </template>

      <template #footer="{ collapsed }">
        <AppUserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
