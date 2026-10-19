<script setup lang="ts">
import { useStatisticsAnalytics } from '~/composables/useStatisticsAnalytics'
import { formatCount, formatMoney, formatPercent } from '~/utils/format'

const {
  barberBreakdown,
  barberOptions,
  barberPieItems,
  dataError,
  employeeDetails,
  filteredHistory,
  hasData,
  needsBranchSelection,
  operationsCards,
  pending,
  rangeError,
  refresh,
  scope,
  scopeContextLabel,
  selectedBarberId
} = useStatisticsAnalytics()

// Эта страница всегда показывает статистику в разрезе филиала.
scope.value = 'branch'
const rankingRef = ref<{ refresh: () => Promise<unknown> | void } | null>(null)
const refreshing = ref(false)
const branchScopeOptions = [{ label: 'Филиал', value: 'branch' as const }]
const employeeModalOpen = ref(false)
const selectedEmployeeId = ref<string | null>(null)
const selectedEmployeeDetail = computed(() => employeeDetails.value.find(item => item.id === selectedEmployeeId.value) || null)

function openEmployeeDetails(employeeId: string) {
  selectedEmployeeId.value = employeeId
  employeeModalOpen.value = true
}

async function refreshAll() {
  refreshing.value = true
  try {
    await Promise.all([refresh(), rankingRef.value?.refresh()])
  }
  finally {
    refreshing.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="statistics-branch">
    <template #header>
      <UDashboardNavbar title="Филиал" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending || refreshing" variant="outline" @click="refreshAll">
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <StatisticsToolbar
          v-model:scope="scope"
          v-model:barber-id="selectedBarberId"
          :barber-options="barberOptions"
          :context-label="scopeContextLabel"
          :count="filteredHistory.length"
          :range-error="rangeError"
          :scope-options="branchScopeOptions"
          subtitle="Период применяется одновременно к операционной статистике и рейтингу качества филиала."
          title="Показатели филиала"
        />

        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
              Статистика филиала
            </p>
            <h1 class="barbershop-heading text-2xl text-charcoal-950">
              Показатели сотрудников филиала
            </h1>
            <p class="text-sm text-charcoal-500">
              {{ scopeContextLabel }} · {{ formatCount(filteredHistory.length) }} записей за период.
            </p>
          </div>
        </div>

        <SharedEmptyState
          v-if="needsBranchSelection"
          description="Выберите филиал через BranchSelector в левой панели, чтобы увидеть статистику."
          icon="i-lucide-map-pinned"
          title="Филиал не выбран"
        />

        <template v-else>
          <UAlert v-if="dataError" color="error" icon="i-lucide-triangle-alert" title="Статистика загружена не полностью" :description="dataError" variant="soft" />
          <div v-if="pending && !hasData" class="grid gap-4 xl:grid-cols-4 md:grid-cols-2" aria-live="polite">
            <USkeleton v-for="index in 4" :key="index" class="h-24 rounded-2xl" />
          </div>
          <div class="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            <DashboardMetricCard
              v-for="card in operationsCards"
              :key="card.label"
              :description="card.description"
              :icon="card.icon"
              :label="card.label"
              :value="card.value"
            />
          </div>

          <div class="space-y-6">
            <StatisticsEmployeeQualityRanking ref="rankingRef" :scope="scope" />

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Разбивка
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    По выручке сотрудников филиала
                  </h2>
                  <p class="text-sm text-charcoal-500">Справочный срез: не влияет на рейтинг качества.</p>
                </div>
              </template>

              <div v-if="barberBreakdown.length" class="space-y-6">
                <div class="flex justify-center">
                  <SharedPieChart
                    :items="barberPieItems"
                    center-label="Записи"
                    empty-label="Нет данных для диаграммы по сотрудникам"
                  />
                </div>

                <div class="space-y-3 max-h-[32rem] overflow-auto pr-1">
                  <button
                    v-for="row in barberBreakdown"
                    :key="row.id"
                    class="w-full rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3 text-left transition hover:border-charcoal-400 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-700"
                    type="button"
                    @click="openEmployeeDetails(row.id)"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="space-y-1">
                        <p class="font-semibold text-charcoal-950">
                          {{ row.label }}
                        </p>
                        <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">
                          {{ formatCount(row.count) }} записей · {{ formatCount(row.uniqueClients) }} клиентов
                        </p>
                      </div>
                      <div class="space-y-1 text-right">
                        <p class="font-semibold text-charcoal-950">
                          {{ formatMoney(row.revenue) }}
                        </p>
                        <p class="text-xs text-charcoal-500">
                          Completion {{ formatPercent(row.completionRate) }}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
              <SharedEmptyState
                v-else
                description="Нет записей для группировки по сотрудникам филиала."
                icon="i-lucide-scissors"
                title="Разбивка пуста"
              />
            </UCard>

          </div>
        </template>
        <StatisticsEmployeeStatisticsModal v-model:open="employeeModalOpen" :detail="selectedEmployeeDetail" />
      </div>
    </template>
  </UDashboardPanel>
</template>
