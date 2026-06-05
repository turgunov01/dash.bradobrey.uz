<script setup lang="ts">
import type { Branch } from '~~/shared/schemas'

import { formatCount, formatMoney } from '~/utils/format'
import { createServicePriceMap, extractHistoryItems, summarizeHistoryMetrics } from '~/utils/historyMetrics'
import { asNumber, toKeyLabel } from '~/utils/normalize'
import { flattenServicesPayload } from '~/utils/services'

definePageMeta({
})

const branchStore = useBranchStore()
const sessionStore = useSessionStore()
const uiStore = useUiStore()
const barbersApi = useBarbersApi()
const historyApi = useHistoryApi()
const kioskApi = useKioskApi()
const promoApi = usePromoApi()

useRealtimeQueue()

await Promise.all([
  branchStore.ensureLoaded(),
  // sessionStore.ensureLoaded()
])

const { data, pending, refresh } = await useAsyncData('overview-dashboard', async () => {
  const emptyQueue = { count: 0, items: [] }
  const rangeQuery = {
    end_date: uiStore.statisticsRange.end,
    from: uiStore.statisticsRange.start,
    start_date: uiStore.statisticsRange.start,
    to: uiStore.statisticsRange.end
  }
  const [health, branches, queue, promoDashboard, history, servicesPayload] = await Promise.all([
    $fetch('/api/health').catch(() => null),
    branchStore.ensureLoaded({ force: true }).catch(() => branchStore.branches),
    (sessionStore.barber?.id || sessionStore.user
      ? barbersApi.queue()
      : Promise.resolve(emptyQueue)).catch(() => emptyQueue),
    promoApi.dashboard({ __skipBranchScope: true }).catch(() => ({ items: [] })),
    historyApi.list({
      __skipBranchScope: true,
      ...rangeQuery
    }).catch(() => ({ items: [] })),
    kioskApi.services({
      __skipBranchScope: true,
      active: true,
      grouped: true
    }).catch(() => ({ services: [] }))
  ])
  const statistics = summarizeHistoryMetrics(
    extractHistoryItems(history),
    createServicePriceMap(flattenServicesPayload(servicesPayload)),
    {
      endDate: uiStore.statisticsRange.end,
      startDate: uiStore.statisticsRange.start
    }
  )

  return {
    branchCount: branches.length,
    health,
    promoDashboard,
    queue,
    statistics
  }
}, {
  watch: [() => uiStore.statisticsRange.end, () => uiStore.statisticsRange.start, () => branchStore.activeBranchId]
})

const promoItems = computed(() => {
  const dashboard = data.value?.promoDashboard as any

  if (Array.isArray(dashboard)) {
    return dashboard
  }

  if (Array.isArray(dashboard?.items)) {
    return dashboard.items
  }

  return []
})

const branchSummaries = computed(() =>
  branchStore.branches.map((branch: Branch) => ({
    id: branch.id,
    isActive: branch.id === branchStore.activeBranchId,
    name: branch.name
  }))
)

const statisticsHighlights = computed(() => {
  const payload = data.value?.statistics || { completed: 0, orders: 0, revenue: 0 }

  return [
    {
      description: 'Итог по всей системе за выбранный период',
      icon: 'i-lucide-wallet',
      label: 'Выручка',
      value: formatMoney(payload.revenue)
    },
    {
      description: 'Объем очереди по данным аналитики',
      icon: 'i-lucide-users-round',
      label: 'Заказы',
      value: formatCount(payload.orders)
    },
    {
      description: 'Количество завершенных записей в аналитике',
      icon: 'i-lucide-check-check',
      label: 'Завершено',
      value: formatCount(payload.completed)
    }
  ]
})

const statRows = computed(() =>
  Object.entries(data.value?.statistics || {})
    .filter(([, value]) => ['number', 'string'].includes(typeof value))
    .slice(0, 8)
)

type ShortcutItem = {
  description: string
  icon: string
  title: string
  to: string
}

const shortcuts = computed(() =>
  [
    // sessionStore.barber?.id
    //   ? { description: 'Управление очередью и перерывами барбера', icon: 'i-lucide-scissors-line-dashed', title: 'Рабочее место', to: '/barbers/workspace' }
    //   : null,
    { description: 'Создание записей через киоск и проверка сценариев филиала', icon: 'i-lucide-monitor-smartphone', title: 'Киоск', to: '/kiosk' },
    { description: 'Управление сгруппированным каталогом услуг', icon: 'i-lucide-badge-dollar-sign', title: 'Услуги', to: '/services' },
    { description: 'Просмотр всех запросов и ответов через Nuxt', icon: 'i-lucide-code-xml', title: 'Отладка API', to: '/api-debug' }
  ].filter((shortcut): shortcut is ShortcutItem => Boolean(shortcut))
)
</script>

<template>
  <UDashboardPanel id="overview">
    <template #header>
      <UDashboardNavbar title="Обзор" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UBadge :color="data?.health ? 'primary' : 'neutral'" variant="soft">
            {{ data?.health ? 'API доступен' : 'Проверка API' }}
          </UBadge>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
          <!-- <DashboardMetricCard description="Текущие записи очереди, назначенные авторизованному барберу."
            icon="i-lucide-clock-3" label="Активная очередь" :value="formatCount(data?.queue?.count)" /> -->
          <DashboardMetricCard description="Филиалы, загруженные из конфигурации киоска." icon="i-lucide-map"
            label="Филиалы" :value="formatCount(data?.branchCount)" />
          <DashboardMetricCard description="Промокоды, полученные с панели управления." icon="i-lucide-ticket-percent"
            label="Промокоды" :value="formatCount(promoItems.length)" />
          <DashboardMetricCard description="Состояние основного health-эндпоинта." icon="i-lucide-heart-pulse"
            label="Состояние" :value="data?.health ? 'OK' : 'В ожидании'" />
        </div>

        <div class="grid gap-6">
          <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
            <template #header>
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Пульс салона
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  Быстрая операционная сводка
                </h2>
              </div>
            </template>

            <div class="grid gap-4 md:grid-cols-3">
              <DashboardMetricCard v-for="card in statisticsHighlights" :key="card.label"
                :description="card.description" :icon="card.icon" :label="card.label" :value="card.value" />
            </div>

            <!-- <div class="mt-6 grid gap-3">
              <div v-for="[key, value] in statRows" :key="key"
                class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3">
                <div class="flex items-center justify-between gap-4">
                  <span class="text-sm font-medium text-charcoal-700">{{ toKeyLabel(key) }}</span>
                  <span class="text-sm font-semibold text-charcoal-950">{{ value }}</span>
                </div>
                <div class="mt-3 h-2 rounded-full bg-sand-100">
                  <div class="h-full rounded-full bg-brass-400"
                    :style="{ width: `${Math.min(asNumber(value, 0), 100)}%` }" />
                </div>
              </div>
            </div> -->
          </UCard>

          <div class="space-y-6">
            <!-- <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Филиалы
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    Активный контекст филиала
                  </h2>
                </div>
              </template>

              <div class="space-y-3">
                <div
                  v-for="branch in branchSummaries"
                  :key="branch.id"
                  :class="[
                    branch.isActive ? 'border-brass-300 bg-brass-50' : 'border-charcoal-200 bg-white/80',
                    'rounded-[1.25rem] border px-4 py-3'
                  ]"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="font-medium text-charcoal-950">{{ branch.name }}</p>
                      <p class="text-xs uppercase tracking-[0.18em] text-charcoal-500">
                        {{ branch.isActive ? 'Текущий контекст' : 'Доступный филиал' }}
                      </p>
                    </div>
                    <UButton
                      color="neutral"
                      size="xs"
                      variant="outline"
                      @click="branchStore.setActiveBranch(branch.id)"
                    >
                      Выбрать филиал
                    </UButton>
                  </div>
                </div>
              </div>
            </UCard> -->

            <!-- <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Быстрые переходы
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    Переход к инструментам
                  </h2>
                </div>
              </template>

              <div class="grid gap-3 sm:grid-cols-2">
                <NuxtLink
                  v-for="shortcut in shortcuts"
                  :key="shortcut.to"
                  :to="shortcut.to"
                  class="rounded-[1.35rem] border border-charcoal-200 bg-white/80 p-4 transition hover:border-brass-300 hover:bg-brass-50/50"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex size-10 items-center justify-center rounded-2xl bg-sand-100 text-brass-700">
                      <UIcon :name="shortcut.icon" class="size-5" />
                    </div>
                    <div class="space-y-1">
                      <p class="font-medium text-charcoal-950">{{ shortcut.title }}</p>
                      <p class="text-sm leading-6 text-charcoal-500">{{ shortcut.description }}</p>
                    </div>
                  </div>
                </NuxtLink>
              </div>
            </UCard> -->
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
