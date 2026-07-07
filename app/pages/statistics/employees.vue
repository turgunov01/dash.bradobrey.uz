<script setup lang="ts">
import { formatCount, formatMoney, formatPercent } from '~/utils/format'

const {
  barberBreakdown,
  barberOptions,
  barberPieItems,
  filteredHistory,
  needsBranchSelection,
  needsBarberSelection,
  operationsCards,
  pending,
  refresh,
  scope,
  scopeContextLabel,
  selectedBarberId,
  topBarbers
} = await useStatisticsAnalytics()
</script>

<template>
  <UDashboardPanel id="statistics-employees">
    <template #header>
      <UDashboardNavbar title="Сотрудники" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
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
          subtitle="Показатели сотрудников считаются по завершённым записям и прайсу услуг в выбранном периоде и области."
          title="Аналитика по сотрудникам"
        />

        <SharedEmptyState
          v-if="needsBranchSelection"
          description="Для режима филиала выберите branch через BranchSelector в левой панели."
          icon="i-lucide-map-pinned"
          title="Филиал не выбран"
        />

        <SharedEmptyState
          v-else-if="needsBarberSelection"
          description="Не найдено ни одного барбера для построения персональной статистики."
          icon="i-lucide-user-round-search"
          title="Барбер не выбран"
        />

        <template v-else>
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

          <div class="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Разбивка
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    По барберам
                  </h2>
                </div>
              </template>

              <div v-if="barberBreakdown.length" class="space-y-6">
                <div class="flex justify-center">
                  <SharedPieChart
                    :items="barberPieItems"
                    center-label="Записи"
                    empty-label="Нет данных для диаграммы по барберам"
                  />
                </div>

                <div class="space-y-3 max-h-[32rem] overflow-auto pr-1">
                  <div
                    v-for="row in barberBreakdown"
                    :key="row.id"
                    class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
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
                  </div>
                </div>
              </div>
              <SharedEmptyState
                v-else
                description="Нет записей для группировки по барберам."
                icon="i-lucide-scissors"
                title="Разбивка пуста"
              />
            </UCard>

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Top-лист
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    Лучшие барберы
                  </h2>
                </div>
              </template>

              <div v-if="topBarbers.length" class="space-y-3">
                <div
                  v-for="(row, index) in topBarbers"
                  :key="row.id"
                  class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex size-9 items-center justify-center rounded-2xl bg-sand-100 font-semibold text-charcoal-900">
                      {{ index + 1 }}
                    </div>
                    <div class="space-y-1">
                      <p class="font-semibold text-charcoal-950">
                        {{ row.label }}
                      </p>
                      <p class="text-xs text-charcoal-500">
                        {{ formatCount(row.count) }} записей
                      </p>
                    </div>
                  </div>
                  <p class="font-semibold text-charcoal-950">
                    {{ formatMoney(row.revenue) }}
                  </p>
                </div>
              </div>
              <SharedEmptyState
                v-else
                description="Нет барберов для ранжирования."
                icon="i-lucide-award"
                title="Top-лист пуст"
              />
            </UCard>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
