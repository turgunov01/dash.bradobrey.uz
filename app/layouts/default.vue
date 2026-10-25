<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import BranchSelector from '~/components/app/BranchSelector.vue'

const open = ref(false)
const branchStore = useBranchStore()
const sessionStore = useSessionStore()
const notifications = useNotifications()

const { flatLinks, primaryLinks, searchGroups, supportLinks } = useDashboardNavigation()

await Promise.all([
  branchStore.ensureLoaded(),
  sessionStore.ensureLoaded()
])

if (import.meta.client) {
  void notifications.refresh()
  useIntervalFn(() => notifications.refresh({ notify: true }), 30000)
}

function closeSidebar() {
  open.value = false
}

function withCloseOnSelect(item: NavigationMenuItem): NavigationMenuItem {
  return Array.isArray(item.children)
    ? { ...item, children: item.children.map(withCloseOnSelect) }
    : { ...item, onSelect: closeSidebar }
}

const mainLinks = computed(() => (primaryLinks.value[0] || []).map(withCloseOnSelect))
const collapsedLinks = computed(() => flatLinks.value.map(withCloseOnSelect))

const utilityLinks = computed(() =>
  (supportLinks[0] || []).map(item => ({
    onSelect: closeSidebar
  }))
)

// Children render flush with their section header (no indent/border) so every
// icon sits on the same vertical line as the search icon.
const navigationUi = {
  link: 'py-1.5 before:rounded-md',
  linkLeadingIcon: 'size-[18px]',
  childList: 'ms-0 border-s-0 ps-0',
  childItem: 'ms-0 ps-0'
}
</script>

<template>
  <UDashboardGroup class="dashboard-shell" unit="rem">
    <UDashboardSidebar
      id="main"
      v-model:open="open"
      collapsible
      resizable
      :default-size="16"
      :min-size="14"
      :max-size="22"
      class="bg-white/70 backdrop-blur-xl"
      :ui="{
        footer: 'lg:border-t lg:border-default/70',
        header: 'h-auto py-3'
      }"
    >
      <template #header="{ collapsed }">
        <AppSidebarBrand :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          :kbds="['/']"
          label="Найти раздел"
          class="bg-elevated/60 ring-default"
        />

        <BranchSelector v-if="!collapsed" :collapsed="collapsed" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="collapsed ? collapsedLinks : mainLinks"
          :ui="navigationUi"
          class="sidebar-nav"
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

    <UDashboardSearch
      :groups="searchGroups"
      shortcut="/"
      description="Быстрый переход по разделам и действиям панели."
      title="Поиск по панели"
    />

    <AppCalculatorModal :show-trigger="false" />

    <slot />
  </UDashboardGroup>
</template>
