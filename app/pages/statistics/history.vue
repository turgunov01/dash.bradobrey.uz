<script setup lang="ts">
import ChartDoughnut from '~/components/shared/ChartDoughnut.vue'
import { useStatisticsAnalytics } from '~/composables/useStatisticsAnalytics'
import { formatCount, formatMoney, formatPercent } from '~/utils/format'

const {
  barberOptions,
  branchBreakdown,
  branchPieItems,
  clientChartData,
  clientMetrics,
  filteredHistory,
  mainMetrics,
  mainStatusChartData,
  needsBranchSelection,
  needsBarberSelection,
  operationsCards,
  paymentBreakdown,
  paymentPieItems,
  pending,
  refresh,
  scope,
  scopeContextLabel,
  selectedBarberId,
  selectedPeriodDays,
  serviceBreakdown,
  serviceChartData,
  statusPieItems,
  timelineRows,
  topBranches,
  topServices
} = await useStatisticsAnalytics()
</script>

<template>
  <UDashboardPanel id="statistics-history">
    <template #header>
      <UDashboardNavbar title="История записей" :ui="{ right: 'gap-3' }">
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
          subtitle="Выручка и средний чек считаются по прайсу услуг в завершённых записях, так как backend не отдаёт отдельное поле revenue."
          title="Бизнес-аналитика по истории записей"
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
          <div class="grid gap-4 md:grid-cols-2">
            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <div class="flex flex-col gap-6">
                <div class="space-y-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Выполнение
                  </p>
                  <h2 class="barbershop-heading text-3xl text-charcoal-950">
                    Завершение заказов
                  </h2>
                  <div class="flex flex-wrap items-center gap-2 text-sm text-charcoal-600">
                    <UBadge color="neutral" variant="soft">
                      Всего {{ formatCount(mainMetrics.orders) }}
                    </UBadge>
                    <UBadge color="neutral" variant="outline">
                      Завершено {{ formatCount(mainMetrics.completed) }}
                    </UBadge>
                    <span class="text-charcoal-500">
                      Выручка в подсказке на графике
                    </span>
                  </div>
                </div>

                <div class="flex w-full justify-center lg:w-auto">
                  <ChartDoughnut
                    :dataset="mainStatusChartData.dataset"
                    :labels="mainStatusChartData.labels"
                    :tooltip-labels="mainStatusChartData.tooltipLabels"
                    title="Завершено / не завершено"
                  />
                </div>
              </div>
            </UCard>

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <div class="flex flex-col gap-6">
                <div class="space-y-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Клиенты
                  </p>
                  <h2 class="barbershop-heading text-3xl text-charcoal-950">
                    Новые / повторные и completion
                  </h2>
                  <div class="flex flex-wrap items-center gap-2 text-sm text-charcoal-600">
                    <UBadge color="neutral" variant="soft">
                      Всего {{ formatCount(clientMetrics.uniqueClients) }}
                    </UBadge>
                    <UBadge color="neutral" variant="outline">
                      Completion {{ formatPercent(clientMetrics.completionRate) }}
                    </UBadge>
                  </div>
                </div>

                <div class="flex w-full justify-center lg:w-auto">
                  <ChartDoughnut
                    :dataset="clientChartData.dataset"
                    :labels="clientChartData.labels"
                    :tooltip-labels="clientChartData.tooltipLabels"
                    title="Клиенты"
                  />
                </div>
              </div>
            </UCard>
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

          <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
            <template #header>
              <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Динамика
                  </p>
                  <h2 class="barbershop-heading text-3xl text-charcoal-950">
                    Завершённые заказы и отказы по дням
                  </h2>
                </div>

                <div class="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-charcoal-500">
                  <div class="flex items-center gap-2">
                    <span class="size-3 rounded-full bg-emerald-400" />
                    Завершено
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="size-3 rounded-full bg-amber-400" />
                    Отказы
                  </div>
                  <UBadge color="neutral" variant="outline">
                    {{ formatCount(selectedPeriodDays) }} дн.
                  </UBadge>
                </div>
              </div>
            </template>

            <div v-if="filteredHistory.length" class="grid gap-6 xl:grid-cols-[0.55fr_0.45fr] items-center">
              <SharedPieChart
                :items="statusPieItems"
                empty-label="За выбранный диапазон нет записей."
                :size="260"
              />

              <div class="space-y-3 max-h-[24rem] overflow-auto pr-1">
                <div
                  v-for="point in timelineRows"
                  :key="point.dateKey"
                  class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/90 px-4 py-3"
                  :title="`${point.label}: ${formatCount(point.completed)} завершено, ${formatCount(point.cancelled)} отказов`"
                >
                  <div class="flex items-center gap-2 text-sm text-charcoal-700">
                    <span class="size-2.5 rounded-full bg-emerald-400" />
                    <span class="font-medium text-charcoal-950">{{ point.label }}</span>
                  </div>
                  <div class="flex items-center gap-3 text-sm font-semibold">
                    <span class="text-emerald-600">{{ formatCount(point.completed) }}</span>
                    <span class="text-charcoal-300">/</span>
                    <span class="text-amber-500">{{ formatCount(point.cancelled) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <SharedEmptyState
              v-else
              description="За выбранный диапазон нет записей для построения диаграммы статусов."
              icon="i-lucide-chart-no-axes-combined"
              title="Нет данных по периоду"
            />
          </UCard>

          <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Разбивка
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    По филиалам
                  </h2>
                </div>
              </template>

              <div v-if="branchBreakdown.length" class="space-y-6">
                <div class="flex justify-center">
                  <SharedPieChart
                    :items="branchPieItems"
                    center-label="Записи"
                    empty-label="Нет данных для диаграммы по филиалам"
                  />
                </div>

                <div class="space-y-3 max-h-[32rem] overflow-auto pr-1">
                  <div
                    v-for="row in branchBreakdown"
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
                description="Нет записей для группировки по филиалам."
                icon="i-lucide-map"
                title="Разбивка пуста"
              />
            </UCard>

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Разбивка
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    По услугам
                  </h2>
                </div>
              </template>

              <div v-if="serviceBreakdown.length" class="flex justify-center">
                <ChartDoughnut
                  :dataset="serviceChartData.dataset"
                  :labels="serviceChartData.labels"
                  title="Использования услуг"
                />
              </div>
              <SharedEmptyState
                v-else
                description="В истории нет услуг для разбивки."
                icon="i-lucide-badge-dollar-sign"
                title="Разбивка пуста"
              />
            </UCard>

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Разбивка
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    По способам оплаты
                  </h2>
                </div>
              </template>

              <div v-if="paymentBreakdown.length" class="space-y-6">
                <div class="flex justify-center">
                  <SharedPieChart
                    :items="paymentPieItems"
                    center-label="Записи"
                    empty-label="Нет данных по оплате"
                  />
                </div>

                <div class="space-y-3">
                  <div
                    v-for="row in paymentBreakdown"
                    :key="row.key"
                    class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="space-y-1">
                        <p class="font-semibold text-charcoal-950">
                          {{ row.label }}
                        </p>
                        <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">
                          {{ formatCount(row.count) }} записей · {{ formatPercent(row.percent) }}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-semibold text-charcoal-950">
                          {{ formatMoney(row.revenue) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <SharedEmptyState
                v-else
                description="Не найдено ни одного способа оплаты."
                icon="i-lucide-credit-card"
                title="Разбивка пуста"
              />
            </UCard>
          </div>

          <div class="grid gap-6 xl:grid-cols-2">
            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Top-лист
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    Лучшие филиалы
                  </h2>
                </div>
              </template>

              <div v-if="topBranches.length" class="space-y-3">
                <div
                  v-for="(row, index) in topBranches"
                  :key="row.id"
                  class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex size-9 items-center justify-center rounded-2xl bg-brass-100 font-semibold text-brass-800">
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
                description="Нет филиалов для ранжирования."
                icon="i-lucide-trophy"
                title="Top-лист пуст"
              />
            </UCard>

            <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Top-лист
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    Частые услуги
                  </h2>
                </div>
              </template>

              <div v-if="topServices.length" class="space-y-3">
                <div
                  v-for="(row, index) in topServices"
                  :key="row.id"
                  class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal-200 bg-white/80 px-4 py-3"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex size-9 items-center justify-center rounded-2xl bg-charcoal-100 font-semibold text-charcoal-900">
                      {{ index + 1 }}
                    </div>
                    <div class="space-y-1">
                      <p class="font-semibold text-charcoal-950">
                        {{ row.label }}
                      </p>
                      <p class="text-xs text-charcoal-500">
                        {{ row.category }} · {{ formatCount(row.count) }} раз
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
                description="Нет услуг для ранжирования."
                icon="i-lucide-list-ordered"
                title="Top-лист пуст"
              />
            </UCard>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
