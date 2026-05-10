<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { formatCount, formatDateTime } from '~/utils/format'

type ActivityRow = {
  at: string | null
  branch: string
  employee: string
  event: string
  id: string
  impact: string
  source: string
  status: 'pending' | 'recorded'
}

type EmployeeMonitorRow = {
  branch: string
  id: string
  lastActivity: string
  login: string
  name: string
  role: string
  status: string
}

const branchStore = useBranchStore()
const barbersApi = useBarbersApi()

await branchStore.ensureLoaded()

const search = ref('')
const eventFilter = ref('all')
const sourceFilter = ref('all')
const selectedDate = ref(new Date().toISOString().slice(0, 10))

const eventOptions = [
  { label: 'Все события', value: 'all' },
  { label: 'Вход', value: 'login' },
  { label: 'Выход', value: 'logout' },
  { label: 'Начало смены', value: 'shift_start' },
  { label: 'Конец смены', value: 'shift_end' },
  { label: 'Перерыв', value: 'break' },
  { label: 'Нарушение', value: 'violation' }
]

const sourceOptions = [
  { label: 'Все источники', value: 'all' },
  { label: 'Киоск барбера', value: 'barber_kiosk' },
  { label: 'Админ-панель', value: 'dashboard' },
  { label: 'Автоматически', value: 'system' }
]

const activityColumns: TableColumn<ActivityRow>[] = [
  { accessorKey: 'employee', header: 'Барбер' },
  { accessorKey: 'event', header: 'Событие' },
  { accessorKey: 'at', header: 'Время' },
  { accessorKey: 'source', header: 'Источник' },
  { accessorKey: 'impact', header: 'Влияние' },
  { accessorKey: 'status', header: 'Статус' }
]

const employeeColumns: TableColumn<EmployeeMonitorRow>[] = [
  { accessorKey: 'name', header: 'Сотрудник' },
  { accessorKey: 'login', header: 'Логин' },
  { accessorKey: 'role', header: 'Роль' },
  { accessorKey: 'branch', header: 'Филиал' },
  { accessorKey: 'status', header: 'Контроль' },
  { accessorKey: 'lastActivity', header: 'Последняя активность' }
]

const { data, pending, refresh } = await useAsyncData('verifix-employees', async () => {
  const response = await barbersApi.list({
    ...(branchStore.activeBranchId ? { branch_id: branchStore.activeBranchId } : {}),
    mode: 'employees'
  })

  return Array.isArray(response?.items) ? response.items : []
}, {
  watch: [() => branchStore.activeBranchId]
})

const branchNameMap = computed(() =>
  new Map(branchStore.branches.map(branch => [String(branch.id), branch.name]))
)

const employeeRows = computed<EmployeeMonitorRow[]>(() =>
  (data.value || [])
    .map((item: any) => {
      const branchId = String(item.branch_id || '')
      const login = String(item.login || '').trim()
      const name = String(item.name || login || '').trim()

      return {
        branch: branchNameMap.value.get(branchId) || 'Не указан',
        id: String(item.id || ''),
        lastActivity: 'Ожидает события',
        login: login || 'Без логина',
        name: name || `Сотрудник ${String(item.id || '').slice(0, 6)}`,
        role: String(item.role || 'barber'),
        status: 'Готов к подключению'
      }
    })
    .filter(row => Boolean(row.id))
)

const activityRows = computed<ActivityRow[]>(() => [])

const filteredActivities = computed(() => {
  const query = search.value.trim().toLowerCase()

  return activityRows.value.filter((row) => {
    const matchesSearch = !query || [row.employee, row.event, row.source].some(value => value.toLowerCase().includes(query))
    const matchesEvent = eventFilter.value === 'all' || row.event === eventFilter.value
    const matchesSource = sourceFilter.value === 'all' || row.source === sourceFilter.value

    return matchesSearch && matchesEvent && matchesSource
  })
})

const metricCards = computed(() => [
  {
    description: 'Сотрудники, которые будут попадать в журнал Verifix.',
    icon: 'i-lucide-users-round',
    label: 'Под контролем',
    value: formatCount(employeeRows.value.length)
  },
  {
    description: 'Входы, выходы и смены за выбранный день.',
    icon: 'i-lucide-activity',
    label: 'События дня',
    value: formatCount(filteredActivities.value.length)
  },
  {
    description: 'События, которые могут влиять на штрафы.',
    icon: 'i-lucide-triangle-alert',
    label: 'Нарушения',
    value: formatCount(filteredActivities.value.filter(row => row.impact !== 'Нет').length)
  },
  {
    description: 'Будущая база для автоматического расчета штрафов.',
    icon: 'i-lucide-calculator',
    label: 'Штрафы',
    value: '0'
  }
])

const plannedSignals = [
  {
    description: 'Фиксировать момент авторизации барбера на киоске.',
    icon: 'i-lucide-log-in',
    title: 'Вход в киоск'
  },
  {
    description: 'Фиксировать выход, закрытие смены и уход с рабочего места.',
    icon: 'i-lucide-log-out',
    title: 'Выход из киоска'
  },
  {
    description: 'Отмечать начало, конец смены, перерывы и возврат.',
    icon: 'i-lucide-clock-3',
    title: 'Рабочее время'
  },
  {
    description: 'Хранить события, которые потом попадут в расчет штрафов.',
    icon: 'i-lucide-file-warning',
    title: 'Основание штрафа'
  }
]
</script>

<template>
  <UDashboardPanel id="verifix">
    <template #header>
      <UDashboardNavbar title="Verifix" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UBadge color="neutral" variant="soft">
            Kiosk activity
          </UBadge>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <section class="rounded-[1.5rem] border border-charcoal-200 bg-white/85 p-5 shadow-sm">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-center gap-4">
              <div class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-charcoal-950 text-white shadow-lg shadow-charcoal-950/15">
                <span class="text-2xl font-black tracking-tight">V</span>
              </div>
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.28em] text-charcoal-500">
                  Verifix
                </p>
                <h1 class="barbershop-heading text-3xl text-charcoal-950">
                  Контроль активности барберов
                </h1>
                <p class="mt-2 max-w-2xl text-sm leading-6 text-charcoal-500">
                  Страница для входов, выходов, смен и событий киоска барбера. Эти данные позже можно использовать как основание для штрафов.
                </p>
              </div>
            </div>

            <div class="grid min-w-64 gap-2 rounded-2xl border border-charcoal-200 bg-sand-50/80 p-3">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-charcoal-500">Дата контроля</span>
                <span class="font-semibold text-charcoal-950">{{ selectedDate }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-charcoal-500">Филиал</span>
                <span class="font-semibold text-charcoal-950">{{ branchStore.activeBranch?.name || 'Все филиалы' }}</span>
              </div>
            </div>
          </div>
        </section>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            v-for="card in metricCards"
            :key="card.label"
            :description="card.description"
            :icon="card.icon"
            :label="card.label"
            :value="card.value"
          />
        </div>

        <UCard class="warm-card rounded-[1.5rem] border border-charcoal-200">
          <template #header>
            <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Activity log
                </p>
                <h2 class="barbershop-heading mt-2 text-2xl text-charcoal-950">
                  Журнал входов и выходов
                </h2>
              </div>

              <div class="grid gap-3 md:grid-cols-4 xl:min-w-[46rem]">
                <UInput v-model="selectedDate" type="date" />
                <UInput v-model="search" icon="i-lucide-search" placeholder="Поиск" />
                <USelect v-model="eventFilter" :items="eventOptions" />
                <USelect v-model="sourceFilter" :items="sourceOptions" />
              </div>
            </div>
          </template>

          <div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <UTable
              :columns="activityColumns"
              :data="filteredActivities"
              sticky="header"
              :ui="{
                root: 'w-full overflow-auto',
                base: 'w-full min-w-[56rem]',
                thead: 'bg-charcoal-50/90',
                tbody: 'divide-y divide-charcoal-100',
                th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
                td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
              }"
            >
              <template #employee-cell="{ row }">
                <span class="font-semibold text-charcoal-950">{{ row.original.employee }}</span>
              </template>
              <template #at-cell="{ row }">
                <span>{{ row.original.at ? formatDateTime(row.original.at) : 'Ожидает данных' }}</span>
              </template>
              <template #status-cell="{ row }">
                <UBadge :color="row.original.status === 'recorded' ? 'primary' : 'neutral'" variant="soft">
                  {{ row.original.status === 'recorded' ? 'Записано' : 'Ожидает' }}
                </UBadge>
              </template>
            </UTable>
          </div>

          <SharedEmptyState
            v-if="!filteredActivities.length"
            class="mt-4"
            description="Для реальных строк нужен backend-журнал событий киоска барбера: login, logout, start shift, stop shift, break и return. Экран уже готов к подключению."
            icon="i-lucide-fingerprint"
            title="Событий Verifix пока нет"
          />
        </UCard>

        <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <UCard class="warm-card rounded-[1.5rem] border border-charcoal-200">
            <template #header>
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Signals
                </p>
                <h2 class="barbershop-heading mt-2 text-2xl text-charcoal-950">
                  Что будет логироваться
                </h2>
              </div>
            </template>

            <div class="grid gap-3">
              <div
                v-for="signal in plannedSignals"
                :key="signal.title"
                class="flex items-start gap-3 rounded-2xl border border-charcoal-200 bg-white/80 p-4"
              >
                <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-brass-700">
                  <UIcon :name="signal.icon" class="size-5" />
                </div>
                <div>
                  <p class="font-semibold text-charcoal-950">{{ signal.title }}</p>
                  <p class="mt-1 text-sm leading-6 text-charcoal-500">{{ signal.description }}</p>
                </div>
              </div>
            </div>
          </UCard>

          <UCard class="warm-card rounded-[1.5rem] border border-charcoal-200">
            <template #header>
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Staff monitor
                  </p>
                  <h2 class="barbershop-heading mt-2 text-2xl text-charcoal-950">
                    Сотрудники под контролем
                  </h2>
                </div>
                <UBadge color="neutral" variant="soft">
                  {{ formatCount(employeeRows.length) }}
                </UBadge>
              </div>
            </template>

            <div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
              <UTable
                :columns="employeeColumns"
                :data="employeeRows"
                :loading="pending"
                sticky="header"
                :ui="{
                  root: 'w-full overflow-auto',
                  base: 'w-full min-w-[54rem]',
                  thead: 'bg-charcoal-50/90',
                  tbody: 'divide-y divide-charcoal-100',
                  th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
                  td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
                }"
              >
                <template #name-cell="{ row }">
                  <span class="font-semibold text-charcoal-950">{{ row.original.name }}</span>
                </template>
                <template #status-cell="{ row }">
                  <UBadge color="neutral" variant="soft">
                    {{ row.original.status }}
                  </UBadge>
                </template>
              </UTable>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
