<script setup lang="ts">
import type { EmployeeStatisticsDetail } from '~/composables/useStatisticsAnalytics'
import { formatCount, formatMoney, formatPercent } from '~/utils/format'

defineProps<{
  detail: EmployeeStatisticsDetail | null
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <UModal v-model:open="open" class="sm:max-w-3xl" :title="detail ? `Статистика: ${detail.label}` : 'Статистика сотрудника'" description="Данные из загруженной истории за выбранный период.">
    <template #body>
      <SharedEmptyState
        v-if="!detail"
        description="Выберите сотрудника в списке, чтобы посмотреть его показатели."
        icon="i-lucide-user-round-search"
        title="Данные сотрудника недоступны"
      />

      <div v-else class="space-y-6">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
          <div v-for="metric in [
            { label: 'Выручка', value: formatMoney(detail.revenue) },
            { label: 'Записи', value: formatCount(detail.orders) },
            { label: 'Завершено', value: `${formatCount(detail.completed)} · ${formatPercent(detail.completionRate)}` },
            { label: 'Клиенты', value: formatCount(detail.uniqueClients) }
          ]" :key="metric.label" class="rounded-xl border border-charcoal-200 bg-charcoal-50/60 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-500">{{ metric.label }}</p>
            <p class="mt-2 text-lg font-semibold text-charcoal-950">{{ metric.value }}</p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl border border-charcoal-200 p-4"><p class="text-sm text-charcoal-500">Отмены</p><p class="mt-1 font-semibold">{{ formatCount(detail.cancelled) }}</p></div>
          <div class="rounded-xl border border-charcoal-200 p-4"><p class="text-sm text-charcoal-500">Не пришёл</p><p class="mt-1 font-semibold">{{ formatCount(detail.noShow) }}</p></div>
          <div class="rounded-xl border border-charcoal-200 p-4"><p class="text-sm text-charcoal-500">Не вовремя</p><p class="mt-1 font-semibold">{{ formatCount(detail.notInTime) }}</p></div>
          <div class="rounded-xl border border-charcoal-200 p-4"><p class="text-sm text-charcoal-500">Средний чек</p><p class="mt-1 font-semibold">{{ formatMoney(detail.averageCheck) }}</p></div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <section>
            <h3 class="font-semibold text-charcoal-950">Операционные показатели</h3>
            <dl class="mt-3 space-y-2 text-sm">
              <div class="flex justify-between gap-4"><dt class="text-charcoal-500">Среднее обслуживание</dt><dd class="font-medium">{{ formatCount(Math.round(detail.averageServiceMinutes)) }} мин</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-charcoal-500">Среднее ожидание</dt><dd class="font-medium">{{ formatCount(Math.round(detail.averageWaitMinutes)) }} мин</dd></div>
            </dl>
          </section>

          <section>
            <h3 class="font-semibold text-charcoal-950">Способы оплаты</h3>
            <SharedEmptyState v-if="!detail.payments.length" class="mt-3" description="В завершённых записях нет данных об оплате." icon="i-lucide-wallet" title="Нет данных" />
            <div v-else class="mt-3 space-y-2 text-sm">
              <div v-for="payment in detail.payments" :key="payment.label" class="flex justify-between gap-4"><span class="text-charcoal-500">{{ payment.label }} · {{ formatCount(payment.count) }}</span><span class="font-medium">{{ formatMoney(payment.revenue) }}</span></div>
            </div>
          </section>
        </div>

        <section>
          <h3 class="font-semibold text-charcoal-950">Услуги</h3>
          <SharedEmptyState v-if="!detail.services.length" class="mt-3" description="В записях сотрудника услуги не указаны." icon="i-lucide-scissors" title="Нет данных" />
          <div v-else class="mt-3 grid gap-2 sm:grid-cols-2">
            <div v-for="service in detail.services" :key="service.label" class="flex justify-between gap-4 rounded-lg border border-charcoal-200 px-3 py-2 text-sm"><span class="truncate">{{ service.label }}</span><span class="shrink-0 text-charcoal-500">{{ formatCount(service.count) }} · {{ formatCount(service.completed) }} завершено</span></div>
          </div>
        </section>
      </div>
    </template>
  </UModal>
</template>
