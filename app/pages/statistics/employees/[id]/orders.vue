<script setup lang="ts">
import type { EmployeeQualityEvidenceResponse } from '~~/shared/statistics/employee-quality-evidence'
import { formatCount, formatDateTime } from '~/utils/format'
import { formatStatusLabel } from '~/utils/display'

const route = useRoute()
const apiClient = useApiClient()
const employeeId = computed(() => String(route.params.id || '').trim())
const categoryLabels: Record<string, string> = {
  employee_failure: 'Ошибки сотрудника',
  suspicious: 'Подозрительные завершения',
  unclassified: 'Неклассифицированные завершения'
}
const pageLimit = 50
const currentCursor = ref<string | null>(null)
const previousCursors = ref<string[]>([])
const baseQueryKey = computed(() => JSON.stringify([
  employeeId.value,
  route.query.category || '',
  route.query.start_date || '',
  route.query.end_date || '',
  route.query.scope || '',
  route.query.branch_id || ''
]))
const query = computed(() => ({
  __skipBranchScope: true,
  category: String(route.query.category || ''),
  end_date: String(route.query.end_date || ''),
  limit: pageLimit,
  scope: String(route.query.scope || ''),
  start_date: String(route.query.start_date || ''),
  ...(route.query.branch_id ? { branch_id: String(route.query.branch_id) } : {}),
  ...(currentCursor.value ? { cursor: currentCursor.value } : {})
}))

watch(baseQueryKey, () => {
  currentCursor.value = null
  previousCursors.value = []
})

const { data, error, pending, refresh } = await useAsyncData(
  () => `employee-quality-evidence-${employeeId.value}-${JSON.stringify(query.value)}`,
  () => apiClient.request<EmployeeQualityEvidenceResponse>(
    `/api/statistics/employees/${encodeURIComponent(employeeId.value)}/orders`,
    { query: query.value, silent: true }
  ),
  { server: false, watch: [query] }
)

const errorMessage = computed(() => {
  const source = error.value as any
  const status = Number(source?.statusCode || source?.status || source?.response?.status || 0)
  if ([401, 403].includes(status)) return 'Нет права просмотра истории, подтверждающей этот показатель.'
  if ([404, 501].includes(status)) return 'Канонический список доказательств ещё не доступен во внешнем API.'
  return source?.data?.message || source?.message || 'Не удалось загрузить доказательства рейтинга.'
})

function nextPage() {
  const nextCursor = data.value?.pagination.next_cursor
  if (!nextCursor) return
  previousCursors.value.push(currentCursor.value || '')
  currentCursor.value = nextCursor
}

function previousPage() {
  if (!previousCursors.value.length) return
  currentCursor.value = previousCursors.value.pop() || null
}
</script>

<template>
  <UDashboardPanel id="employee-quality-evidence">
    <template #header>
      <UDashboardNavbar title="Доказательства рейтинга" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">Обновить</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">Employee quality v1</p>
            <h1 class="barbershop-heading text-3xl text-charcoal-950">{{ categoryLabels[String(route.query.category)] || 'Доказательства' }}</h1>
            <p class="text-sm text-charcoal-500">Сотрудник {{ employeeId }} · {{ route.query.start_date }} — {{ route.query.end_date }}</p>
          </div>
          <UButton icon="i-lucide-arrow-left" to="/statistics/employees" variant="ghost">К рейтингу</UButton>
        </div>

        <div v-if="pending && !data" class="space-y-3">
          <USkeleton v-for="index in 4" :key="index" class="h-16 w-full rounded-2xl" />
        </div>
        <UAlert v-else-if="error" color="error" icon="i-lucide-triangle-alert" title="Доказательства не загружены" :description="errorMessage" variant="soft">
          <template #actions><UButton color="error" size="sm" variant="outline" @click="refresh()">Повторить</UButton></template>
        </UAlert>
        <SharedEmptyState v-else-if="!data?.orders.length" description="Для выбранного показателя нет канонических записей." icon="i-lucide-file-search" title="Список пуст" />
        <div v-else class="overflow-x-auto rounded-2xl border border-charcoal-200">
          <table class="min-w-[980px] w-full text-left text-sm">
            <thead class="bg-charcoal-50 text-[11px] uppercase tracking-[0.14em] text-charcoal-500">
              <tr>
                <th class="px-4 py-3">Заказ</th><th class="px-4 py-3">Статус</th><th class="px-4 py-3">Классификация</th>
                <th class="px-4 py-3">Причина</th><th class="px-4 py-3">Факт / ожидание</th><th class="px-4 py-3">Время события</th><th class="px-4 py-3">Проверка</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in data.orders" :key="order.order_id" class="border-t border-charcoal-200">
                <td class="px-4 py-4 font-mono text-xs">{{ order.order_id }}</td>
                <td class="px-4 py-4">{{ formatStatusLabel(order.status) }}</td>
                <td class="px-4 py-4">{{ order.classification }}</td>
                <td class="px-4 py-4">{{ order.reason_code || '—' }}</td>
                <td class="px-4 py-4">{{ order.actual_minutes ?? '—' }} / {{ order.expected_minutes ?? '—' }} мин.</td>
                <td class="px-4 py-4">{{ formatDateTime(order.occurred_at || order.completed_at) }}</td>
                <td class="px-4 py-4">{{ order.review_state || '—' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-charcoal-200 px-4 py-3">
            <p class="text-xs text-charcoal-500">
              Всего канонических записей: {{ formatCount(data.pagination.total) }} · страница {{ previousCursors.length + 1 }}
            </p>
            <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                icon="i-lucide-chevron-left"
                size="sm"
                variant="outline"
                :disabled="!previousCursors.length || pending"
                @click="previousPage"
              >Назад</UButton>
              <UButton
                color="neutral"
                icon="i-lucide-chevron-right"
                size="sm"
                trailing
                variant="outline"
                :disabled="!data.pagination.next_cursor || pending"
                @click="nextPage"
              >Далее</UButton>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
