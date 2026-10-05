<script setup lang="ts">
import { getEffectiveEmployeePermissions } from '~~/shared/auth/employees'
import {
  buildEmployeeQualitySections,
  getEmployeeQualityErrorMessage,
  sanitizeEmployeeQualityResponse,
  type EmployeeQualityUiScope
} from '~~/shared/statistics/employee-quality'
import { formatCount, formatMoney, formatPercent } from '~/utils/format'

const props = defineProps<{
  scope: EmployeeQualityUiScope
  selectedEmployeeId?: string
}>()

const apiClient = useApiClient()
const branchStore = useBranchStore()
const sessionStore = useSessionStore()
const uiStore = useUiStore()

function buildQuery() {
  const permissions = new Set(getEffectiveEmployeePermissions(sessionStore.user))
  const query: Record<string, string> = {
    start_date: uiStore.statisticsRange.start,
    end_date: uiStore.statisticsRange.end
  }

  if (props.scope === 'self') {
    query.scope = 'self'
    return query
  }

  if (props.scope === 'branch') {
    if (!branchStore.activeBranchId) return null
    query.scope = 'branch'
    query.branch_id = branchStore.activeBranchId
    return query
  }

  if (props.scope === 'global') {
    query.scope = 'global'
    return query
  }

  if (!props.selectedEmployeeId) return null

  if (permissions.has('statistics.read.global')) {
    query.scope = 'global'
  }
  else if (permissions.has('statistics.read.branch') && branchStore.activeBranchId) {
    query.scope = 'branch'
    query.branch_id = branchStore.activeBranchId
  }
  else {
    query.scope = 'self'
    return query
  }

  query.employee_id = props.selectedEmployeeId
  return query
}

const queryKey = computed(() => JSON.stringify([
  props.scope,
  props.selectedEmployeeId || '',
  branchStore.activeBranchId || '',
  uiStore.statisticsRange.start,
  uiStore.statisticsRange.end
]))

const rankingData = useAsyncData('employee-quality-ranking', async () => {
  await Promise.all([sessionStore.ensureLoaded(), branchStore.ensureLoaded()])
  const query = buildQuery()

  if (!query) return null

  const response = await apiClient.request<unknown>('/api/statistics/employees', {
    query,
    silent: true
  })

  return sanitizeEmployeeQualityResponse(response)
}, {
  immediate: false,
  server: false,
  watch: [queryKey]
})

const { data, error, pending, refresh } = rankingData
const sections = computed(() => buildEmployeeQualitySections(data.value?.employees || []))
const errorMessage = computed(() => error.value ? getEmployeeQualityErrorMessage(error.value) : '')
const showOrdinalRank = computed(() => {
  if (!['barber', 'self'].includes(props.scope)) return true
  return Number(data.value?.pagination?.total || 0) > 1
})
const hasDataQualityWarnings = computed(() => {
  const quality = data.value?.data_quality
  return Boolean(quality && (
    quality.unassigned_orders
    || quality.unclassifiable_completed
    || quality.unattributed_terminal_outcomes
  ))
})

// Keep the SSR markup and the first client render identical. Starting a
// client-only request during hydration changes UButton loading state and the
// empty/skeleton branches before Vue has attached to the server DOM.
onMounted(() => {
  void refresh()
})

function statusLabel(entry: (typeof sections.value.eligible)[number]) {
  if (!entry.eligible) return 'Недостаточно данных'
  return entry.metrics.suspicious_count > 0 ? 'Требует проверки' : 'Чисто'
}

function statusColor(entry: (typeof sections.value.eligible)[number]) {
  if (!entry.eligible) return 'neutral'
  return entry.metrics.suspicious_count > 0 ? 'warning' : 'success'
}

function provisionalReason(value: string | null) {
  const labels: Record<string, string> = {
    approximate_data: 'Доступны только приблизительные исторические данные',
    employee_archived: 'Сотрудник был архивирован и не входит в активный рейтинг',
    employee_inactive: 'Сотрудник неактивен и не входит в активный рейтинг',
    insufficient_classifiable_completed: 'Недостаточно классифицируемых завершённых заказов',
    insufficient_classification_coverage: 'Недостаточная полнота данных',
    mixed_data: 'Период содержит смешанные авторитетные и приблизительные данные',
    no_completed_orders: 'В выбранном периоде нет завершённых заказов',
    no_authoritative_snapshot: 'Нет авторитетных снимков длительности'
  }

  return value ? labels[value] || value : 'Недостаточно данных для официального места'
}

function evidenceQuery(employeeId: string, category: 'employee_failure' | 'suspicious') {
  const rankingQuery = buildQuery()
  if (!rankingQuery) return null

  return {
    category,
    start_date: uiStore.statisticsRange.start,
    end_date: uiStore.statisticsRange.end,
    scope: rankingQuery.scope,
    ...(rankingQuery.branch_id ? { branch_id: rankingQuery.branch_id } : {}),
    employee_id: employeeId
  }
}

function canViewEvidence(employeeId: string) {
  const permissions = new Set(getEffectiveEmployeePermissions(sessionStore.user))
  const query = evidenceQuery(employeeId, 'suspicious')
  if (!query) return false

  return query.scope === 'self'
    ? permissions.has('history.read.self') || permissions.has('history.read.branch')
    : permissions.has('history.read.branch')
}

function evidenceLink(employeeId: string, category: 'employee_failure' | 'suspicious') {
  return {
    path: `/statistics/employees/${encodeURIComponent(employeeId)}/orders`,
    query: evidenceQuery(employeeId, category) || {}
  }
}

defineExpose({ refresh })
</script>

<template>
  <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
    <template #header>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
            Employee quality v1
          </p>
          <h2 class="barbershop-heading text-2xl text-charcoal-950">
            Рейтинг качества сотрудников
          </h2>
          <p class="max-w-3xl text-sm leading-6 text-charcoal-500">
            Место определяет качество и надёжность. Выручка показана только для контекста и не влияет на порядок.
          </p>
        </div>
        <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
          Обновить рейтинг
        </UButton>
      </div>
    </template>

    <div class="space-y-5">
      <details class="rounded-2xl border border-charcoal-200 bg-charcoal-50/60 px-4 py-3 text-sm text-charcoal-700">
        <summary class="cursor-pointer font-semibold text-charcoal-950">Как считается рейтинг</summary>
        <ol class="mt-3 list-decimal space-y-1 pl-5 leading-6">
          <li>Сначала сотрудники без подозрительных заказов.</li>
          <li>Затем меньше подозрительных заказов и меньшая их доля.</li>
          <li>После этого больше доверенных завершённых заказов.</li>
          <li>При равенстве — меньше подтверждённых ошибок сотрудника.</li>
        </ol>
        <p class="mt-2 text-charcoal-500">
          Официальное место присваивается при минимум {{ data?.rules.minimum_classifiable_completed ?? 10 }} классифицируемых завершениях
          и покрытии не ниже {{ formatPercent((data?.rules.minimum_classification_coverage ?? 0.9) * 100) }}.
        </p>
        <p class="mt-1 text-charcoal-500">
          Порог подозрительности API: фактическая длительность строго меньше
          {{ formatPercent((data?.rules.suspicious_duration_ratio ?? 0.5) * 100) }} ожидаемой длительности услуги.
        </p>
        <p class="mt-1 text-charcoal-500">Неявка клиента, опоздание клиента и нейтральные отмены место не снижают.</p>
      </details>

      <div v-if="pending && !data" class="space-y-3" aria-live="polite">
        <USkeleton v-for="index in 4" :key="index" class="h-16 w-full rounded-2xl" />
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        icon="i-lucide-triangle-alert"
        title="Рейтинг качества не загружен"
        :description="errorMessage"
        variant="soft"
      >
        <template #actions>
          <UButton color="error" size="sm" variant="outline" @click="refresh()">Повторить</UButton>
        </template>
      </UAlert>

      <SharedEmptyState
        v-else-if="!data"
        description="Выберите доступную область и сотрудника, чтобы запросить рейтинг."
        icon="i-lucide-list-filter"
        title="Область рейтинга не выбрана"
      />

      <template v-else>
        <UAlert
          v-if="hasDataQualityWarnings"
          color="warning"
          icon="i-lucide-database-zap"
          title="Есть проблемы качества данных"
          :description="`Неклассифицировано: ${formatCount(data.data_quality.unclassifiable_completed)}; без сотрудника: ${formatCount(data.data_quality.unassigned_orders)}; без автора результата: ${formatCount(data.data_quality.unattributed_terminal_outcomes)}.`"
          variant="soft"
        />

        <div v-if="sections.eligible.length" class="overflow-x-auto rounded-2xl border border-charcoal-200">
          <table class="min-w-[1040px] w-full text-left text-sm">
            <thead class="bg-charcoal-50 text-[11px] uppercase tracking-[0.14em] text-charcoal-500">
              <tr>
                <th class="px-4 py-3">Место</th>
                <th class="px-4 py-3">Сотрудник</th>
                <th class="px-4 py-3">Статус</th>
                <th class="px-4 py-3">Доверенные / всего</th>
                <th class="px-4 py-3">Подозрительные</th>
                <th class="px-4 py-3">Ошибки сотрудника</th>
                <th class="px-4 py-3">Нейтральные исходы</th>
                <th class="px-4 py-3">Полнота</th>
                <th class="px-4 py-3 text-right">Выручка</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in sections.eligible" :key="entry.employee.id" class="border-t border-charcoal-200 align-top">
                <td class="px-4 py-4 text-lg font-semibold text-charcoal-950">{{ showOrdinalRank ? entry.rank : '—' }}</td>
                <td class="px-4 py-4">
                  <p class="font-semibold text-charcoal-950">{{ entry.employee.name }}</p>
                  <p class="mt-1 max-w-xs text-xs leading-5 text-charcoal-500">{{ entry.rank_reason || 'Место рассчитано сервером по employee-quality-v1.' }}</p>
                </td>
                <td class="px-4 py-4"><UBadge :color="statusColor(entry)" variant="soft">{{ statusLabel(entry) }}</UBadge></td>
                <td class="px-4 py-4 font-medium">{{ formatCount(entry.metrics.trusted_completed) }} / {{ formatCount(entry.metrics.completed) }}</td>
                <td class="px-4 py-4">
                  <NuxtLink v-if="canViewEvidence(entry.employee.id)" :to="evidenceLink(entry.employee.id, 'suspicious')" class="font-medium text-amber-700 underline-offset-4 hover:underline">
                    {{ formatCount(entry.metrics.suspicious_count) }} · {{ formatPercent(entry.metrics.suspicious_rate * 100) }}
                  </NuxtLink>
                  <span v-else class="font-medium text-amber-700">{{ formatCount(entry.metrics.suspicious_count) }} · {{ formatPercent(entry.metrics.suspicious_rate * 100) }}</span>
                </td>
                <td class="px-4 py-4">
                  <NuxtLink v-if="canViewEvidence(entry.employee.id)" :to="evidenceLink(entry.employee.id, 'employee_failure')" class="font-medium text-red-700 underline-offset-4 hover:underline">
                    {{ formatCount(entry.metrics.employee_failure_count) }} · {{ formatPercent(entry.metrics.employee_failure_rate * 100) }}
                  </NuxtLink>
                  <span v-else class="font-medium text-red-700">{{ formatCount(entry.metrics.employee_failure_count) }} · {{ formatPercent(entry.metrics.employee_failure_rate * 100) }}</span>
                </td>
                <td class="px-4 py-4 text-charcoal-600">
                  Неявка {{ formatCount(entry.metrics.no_show_count) }} · не успел {{ formatCount(entry.metrics.not_in_time_count) }} · нейтральные отмены {{ formatCount(entry.metrics.neutral_cancelled_count) }}
                </td>
                <td class="px-4 py-4">{{ formatPercent(entry.metrics.classification_coverage * 100) }}</td>
                <td class="px-4 py-4 text-right font-semibold text-charcoal-950">{{ formatMoney(entry.metrics.revenue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <SharedEmptyState
          v-else-if="!sections.insufficient.length"
          description="В выбранном периоде нет сотрудников и заказов для построения рейтинга."
          icon="i-lucide-chart-no-axes-combined"
          title="Нет данных для рейтинга"
        />

        <UAlert
          v-if="!sections.eligible.length && sections.insufficient.length"
          color="neutral"
          icon="i-lucide-circle-help"
          title="Нет сотрудников с официальным местом"
          description="Все найденные сотрудники находятся ниже порога объёма или качества данных."
          variant="soft"
        />

        <div v-if="sections.insufficient.length" class="space-y-3">
          <div>
            <h3 class="font-semibold text-charcoal-950">Недостаточно данных</h3>
            <p class="text-sm text-charcoal-500">Эти сотрудники отображаются без места и не смешиваются с официальным рейтингом.</p>
          </div>
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div v-for="entry in sections.insufficient" :key="entry.employee.id" class="rounded-2xl border border-charcoal-200 bg-white/80 p-4">
              <div class="flex items-start justify-between gap-3">
                <p class="font-semibold text-charcoal-950">{{ entry.employee.name }}</p>
                <UBadge color="neutral" variant="soft">Без места</UBadge>
              </div>
              <p class="mt-2 text-sm text-charcoal-600">{{ provisionalReason(entry.provisional_reason) }}</p>
              <p class="mt-2 text-xs text-charcoal-500">
                {{ formatCount(entry.metrics.classifiable_completed) }} классифицируемых · полнота {{ formatPercent(entry.metrics.classification_coverage * 100) }}
              </p>
              <p class="mt-1 text-xs text-charcoal-400">Источник: {{ entry.metrics.assessment_source || 'не указан' }}</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </UCard>
</template>
