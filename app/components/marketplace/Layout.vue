<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

export type MarketplaceTab = TabsItem & { to?: string }

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  tabs: MarketplaceTab[]
}>(), {
  title: 'Маркетплейс',
  subtitle: 'Управление сущностями marketplace API'
})

const route = useRoute()

const activeTab = ref<string>(props.tabs[0]?.value ? String(props.tabs[0].value) : '')

watchEffect(() => {
  const matched = props.tabs.find((tab) => {
    const target = typeof tab.to === 'string' ? tab.to : null
    if (!target) return false

    return route.path === target || route.path.startsWith(`${target}/`)
  })

  if (matched?.value !== undefined) {
    activeTab.value = String(matched.value)
  }
})

watch(activeTab, (next) => {
  const tab = props.tabs.find(candidate => String(candidate.value) === String(next))
  const destination = typeof tab?.to === 'string' ? tab.to : null

  if (destination && route.path !== destination) {
    navigateTo(destination)
  }
})
</script>

<template>
  <UDashboardPanel id="admin-marketplace">
    <template #header>
      <UDashboardNavbar :title="title" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <slot name="actions" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                {{ subtitle }}
              </p>
              <h2 class="barbershop-heading text-3xl text-charcoal-950">
                {{ title }}
              </h2>
            </div>

            <div class="overflow-x-auto">
              <UTabs
                v-model="activeTab"
                :content="false"
                :items="tabs"
                :ui="{
                  root: 'min-w-max items-start',
                  list: 'inline-flex w-max rounded-[1.35rem] bg-charcoal-100 p-1.5',
                  indicator: 'rounded-[0.95rem] bg-primary shadow-none',
                  trigger: 'h-11 rounded-[0.95rem] px-4 text-sm font-semibold data-[state=active]:text-inverted sm:text-[15px]',
                  label: 'whitespace-nowrap'
                }"
              />
            </div>
          </div>
        </UCard>

        <slot />
      </div>
    </template>
  </UDashboardPanel>
</template>

