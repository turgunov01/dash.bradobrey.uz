<script setup lang="ts">
import BranchSelector from '~/components/app/BranchSelector.vue'

const open = ref(false)
const branchStore = useBranchStore()
const sessionStore = useSessionStore()

const { primaryLinks, searchGroups, supportLinks } = useDashboardNavigation()

await Promise.all([
  branchStore.ensureLoaded(),
  sessionStore.ensureLoaded()
])

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
    onSelect: closeSidebar
  }))
)
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="main"
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
        <div class="w-full space-y-4">
          <BranchSelector :collapsed="collapsed" />
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />
        <!-- <AppCalculatorModal :collapsed="collapsed" :show-modal="false" /> -->

        <UNavigationMenu
          :collapsed="collapsed"
          :items="mainLinks"
          class="mt-0"
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
      description="Быстрый переход по разделам и действиям панели."
      title="Поиск по панели"
    />

    <AppCalculatorModal :show-trigger="false" />

    <slot />
  </UDashboardGroup>
</template>
