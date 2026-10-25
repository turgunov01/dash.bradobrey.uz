<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { BarberProfile, Branch } from '~~/shared/schemas'
import { barberSchema } from '~~/shared/schemas'
import { formatCount, formatDateTime, formatMoney, formatPercent } from '~/utils/format'
import { asNumber, toKeyLabel } from '~/utils/normalize'

type BarberAccount = {
  branch_id: string | null
  id: string
  login: string | null
  role: string | null
}

type BarberRow = {
  barberId: string
  branchId: string
  branchName: string
  createdAt: string | null
  id: string
  isActive: boolean | null
  isOnBreak: boolean | null
  isOnShift: boolean | null
  login: string | null
  name: string
  phone: string | null
  profile: (BarberProfile & Record<string, any>) | null
  role: string | null
  specialization: string | null
}

function extractBarberItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    barbers?: unknown[]
    data?: unknown[] | { items?: unknown[], entry?: unknown[] }
    entry?: unknown[]
    items?: unknown[]
  }

  if (Array.isArray(payload.barbers)) {
    return payload.barbers
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.entry)) {
    return payload.entry
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.data?.items)) {
    return payload.data.items
  }

  if (Array.isArray(payload.data?.entry)) {
    return payload.data.entry
  }

  return []
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()

  return text ? text : null
}

function pickText(source: Record<string, any> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = normalizeText(source?.[key])

    if (value) {
      return value
    }
  }

  return null
}

function pickNumber(source: Record<string, any> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = source?.[key]

    if (value === undefined || value === null || value === '') {
      continue
    }

    const amount = Number(value)

    if (Number.isFinite(amount)) {
      return amount
    }
  }

  return null
}

function looksLikePhone(value: string | null) {
  if (!value) {
    return false
  }

  return /^[+\d][\d\s()-]{5,}$/.test(value)
}

function resolveCreatedAt(profile: Record<string, any>) {
  return pickText(profile, ['created_at', 'createdAt', 'registered_at'])
    || pickText(profile.user, ['created_at', 'createdAt', 'registered_at'])
}

function resolveBarberName(profile: BarberProfile & Record<string, any>) {
  return pickText(profile, ['name'])
    || pickText(profile.user, ['name'])
    || `Барбер ${profile.id}`
}

function resolveBarberLogin(profile: BarberProfile & Record<string, any>) {
  return pickText(profile.user, ['login', 'username'])
    || pickText(profile, ['login', 'username'])
}

function resolveBarberPhone(profile: BarberProfile & Record<string, any>) {
  return pickText(profile, ['phone', 'phone_number'])
    || pickText(profile.user, ['phone', 'phone_number'])
}

function resolveBarberRole(profile: BarberProfile & Record<string, any>) {
  return pickText(profile.user, ['role'])
    || pickText(profile, ['role'])
}

const branchStore = useBranchStore()
const barbersApi = useBarbersApi()
const kioskApi = useKioskApi()
const statisticsApi = useStatisticsApi()
const uiStore = useUiStore()

const page = ref(1)
const itemsPerPage = 12
const detailModalOpen = ref(false)
const detailPending = ref(false)
const detailError = ref('')
const detailStats = ref<Record<string, any> | null>(null)
const selectedBarber = ref<BarberRow | null>(null)

await branchStore.ensureLoaded()

const columns: TableColumn<BarberRow>[] = [
  { accessorKey: 'name', header: 'БАРБЕР' },
  { accessorKey: 'branchName', header: 'ФИЛИАЛ' },
  { accessorKey: 'phone', header: 'ТЕЛЕФОН' },
  { accessorKey: 'login', header: 'ЛОГИН' },
  { accessorKey: 'isActive', header: 'СТАТУС' },
  { accessorKey: 'createdAt', header: 'СОЗДАН' },
  { id: 'actions', header: '' }
]

const { data, pending, refresh } = await useAsyncData('barber-history-directory', async () => {
  const selectedBranches = branchStore.activeBranchId
    ? branchStore.branches.filter(branch => branch.id === branchStore.activeBranchId)
    : [...branchStore.branches]
  const branchMap = new Map(selectedBranches.map(branch => [branch.id, branch]))

  const [accountsResponse, results] = await Promise.all([
    barbersApi.list(
      branchStore.activeBranchId
        ? { branch_id: branchStore.activeBranchId }
        : undefined
    ),
    Promise.allSettled(
      selectedBranches.map(async (branch) => {
        const response = await kioskApi.barbers(branch.id)

        return {
          branch,
          items: extractBarberItems(response)
        }
      })
    )
  ])

  const failedBranches: Branch[] = []
  const activeProfiles = new Map<string, BarberProfile & Record<string, any>>()

  results.forEach((result, index) => {
    const branch = selectedBranches[index]

    if (!branch) {
      return
    }

    if (result.status !== 'fulfilled') {
      failedBranches.push(branch)
      return
    }

    for (const item of result.value.items) {
      const parsed = barberSchema.safeParse(item)

      if (parsed.success) {
        activeProfiles.set(String(parsed.data.id), parsed.data as BarberProfile & Record<string, any>)
      }
    }
  })

  const accounts = Array.isArray(accountsResponse?.items) ? accountsResponse.items as BarberAccount[] : []
  const rows: BarberRow[] = accounts.map((account) => {
    const profile = activeProfiles.get(String(account.id)) || null
    const branchId = account.branch_id || profile?.branch_id || ''
    const branch = branchId ? branchMap.get(String(branchId)) : null
    const login = account.login || (profile ? resolveBarberLogin(profile) : null)
    const phoneFromLogin = looksLikePhone(login) ? login : null

    return {
      barberId: String(account.id),
      branchId: branchId ? String(branchId) : '',
      branchName: branch?.name || 'Филиал не указан',
      createdAt: profile ? resolveCreatedAt(profile) : null,
      id: String(account.id),
      isActive: profile
        ? (typeof profile.is_active === 'boolean' ? profile.is_active : true)
        : false,
      isOnBreak: profile
        ? (typeof profile.is_on_break === 'boolean' ? profile.is_on_break : false)
        : false,
      isOnShift: profile
        ? (typeof profile.is_on_shift === 'boolean' ? profile.is_on_shift : false)
        : false,
      login,
      name: profile
        ? resolveBarberName(profile)
        : (login || `Барбер ${String(account.id).slice(0, 8)}`),
      phone: (profile ? resolveBarberPhone(profile) : null) || phoneFromLogin,
      profile,
      role: account.role || (profile ? resolveBarberRole(profile) : null),
      specialization: profile ? pickText(profile, ['specialization']) : null
    }
  }).sort((left, right) => {
    const branchComparison = left.branchName.localeCompare(right.branchName, 'ru')

    return branchComparison !== 0
      ? branchComparison
      : left.name.localeCompare(right.name, 'ru')
  })

  return {
    failedBranches,
    rows
  }
}, {
  lazy: true,
  watch: [() => branchStore.activeBranchId]
})

const isBarbersInitialLoading = computed(() => pending.value && !data.value)
const barberRows = computed(() => data.value?.rows || [])
const failedBranches = computed(() => data.value?.failedBranches || [])

const paginatedBarbers = computed(() => {
  const start = (page.value - 1) * itemsPerPage

  return barberRows.value.slice(start, start + itemsPerPage)
})

const pageFrom = computed(() =>
  barberRows.value.length ? (page.value - 1) * itemsPerPage + 1 : 0
)

const pageTo = computed(() =>
  barberRows.value.length
    ? Math.min(page.value * itemsPerPage, barberRows.value.length)
    : 0
)

const detailDescription = computed(() => {
  if (!selectedBarber.value) {
    return 'Детальная карточка барбера.'
  }

  return `${selectedBarber.value.branchName}, статистика за ${uiStore.statisticsRange.start} - ${uiStore.statisticsRange.end}`
})

const detailMetrics = computed(() => {
  const stats = detailStats.value || {}
  const revenue = pickNumber(stats, ['revenue', 'total_revenue', 'amount', 'total_amount']) || 0
  const totalOrders = pickNumber(stats, ['orders', 'queue_count', 'count', 'total_orders']) || 0
  const completedOrders = pickNumber(stats, ['completed', 'completed_orders', 'done']) || 0
  const explicitRate = pickNumber(stats, ['completion_rate', 'completion_percentage', 'completed_percent', 'completion_percent'])
  const completionRate = explicitRate ?? (totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0)

  return [
    {
      description: 'Сумма по найденным полям выручки барбера.',
      label: 'Заработал',
      value: formatMoney(revenue)
    },
    {
      description: 'Количество заказов в статистическом ответе.',
      label: 'Заказы',
      value: formatCount(totalOrders)
    },
    {
      description: 'Завершенные визиты по статистике.',
      label: 'Завершено',
      value: formatCount(completedOrders)
    },
    {
      description: 'Либо явное поле completion_rate, либо расчет completed/orders.',
      label: 'Выполнение',
      value: formatPercent(completionRate)
    }
  ]
})

const detailFacts = computed(() => {
  if (!selectedBarber.value) {
    return []
  }

  return [
    { label: 'Филиал', value: selectedBarber.value.branchName },
    { label: 'Логин', value: selectedBarber.value.login || 'Не указан' },
    { label: 'Телефон', value: selectedBarber.value.phone || 'Не указан' },
    { label: 'Создан логин', value: formatDateTime(selectedBarber.value.createdAt) },
    { label: 'Специализация', value: selectedBarber.value.specialization || 'Не указана' },
    { label: 'Роль', value: selectedBarber.value.role || 'Не указана' },
    { label: 'Активность', value: selectedBarber.value.isActive === false ? 'Неактивен' : 'Активен' },
    { label: 'Смена', value: selectedBarber.value.isOnShift ? 'На смене' : 'Вне смены' },
    { label: 'Перерыв', value: selectedBarber.value.isOnBreak ? 'На перерыве' : 'Нет' }
  ]
})

const extraDetailRows = computed(() =>
  Object.entries(detailStats.value || {})
    .filter(([key, value]) =>
      !['revenue', 'total_revenue', 'amount', 'total_amount', 'orders', 'queue_count', 'count', 'total_orders', 'completed', 'completed_orders', 'done', 'completion_rate', 'completion_percentage', 'completed_percent', 'completion_percent'].includes(key)
      && ['number', 'string'].includes(typeof value)
    )
    .slice(0, 8)
)

watch(
  () => barberRows.value.length,
  (length) => {
    const maxPage = Math.max(1, Math.ceil(length / itemsPerPage))

    if (page.value > maxPage) {
      page.value = maxPage
    }
  },
  { immediate: true }
)

watch(
  [() => uiStore.statisticsRange.start, () => uiStore.statisticsRange.end],
  async () => {
    if (detailModalOpen.value && selectedBarber.value) {
      await loadBarberDetails(selectedBarber.value)
    }
  }
)

watch(detailModalOpen, (open) => {
  if (!open) {
    detailError.value = ''
    detailPending.value = false
    detailStats.value = null
    selectedBarber.value = null
  }
})

async function loadBarberDetails(barber: BarberRow) {
  detailPending.value = true
  detailError.value = ''

  try {
    const response = await statisticsApi.barber(barber.barberId, {
      end_date: uiStore.statisticsRange.end,
      start_date: uiStore.statisticsRange.start
    })

    detailStats.value = response && typeof response === 'object' && !Array.isArray(response)
      ? response as Record<string, any>
      : {}
  }
  catch (error) {
    detailError.value = error instanceof Error ? error.message : 'Не удалось загрузить детали барбера.'
  }
  finally {
    detailPending.value = false
  }
}

async function openDetails(barber: BarberRow) {
  selectedBarber.value = barber
  detailModalOpen.value = true
  await loadBarberDetails(barber)
}
</script>

<template>
  <UDashboardPanel id="barber-history">
    <template #header>
      <UDashboardNavbar title="История барбера" :ui="{ right: 'gap-3' }">
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
      <UCard class="warm-card rounded-[1.25rem] border border-charcoal-200">
        <template #header>
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                Все филиалы
              </p>
              <h2 class="barbershop-heading text-3xl text-charcoal-950">
                Полный список барберов
              </h2>
              <p class="text-sm text-charcoal-500">
                Список строится по всем аккаунтам барберов, а не только по активным профилям kiosk API.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,13rem)_minmax(0,13rem)]">
              <UFormField label="Период с">
                <UInput v-model="uiStore.statisticsRange.start" type="date" />
              </UFormField>
              <UFormField label="Период по">
                <UInput v-model="uiStore.statisticsRange.end" type="date" />
              </UFormField>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <USkeleton v-if="isBarbersInitialLoading" class="h-7 w-28 rounded-md" />
            <UBadge v-else color="neutral" size="lg" variant="soft">
              {{ barberRows.length }} барберов
            </UBadge>
            <UBadge color="neutral" variant="outline">
              {{ branchStore.branches.length }} филиалов
            </UBadge>
            <UBadge v-if="failedBranches.length" color="warning" variant="outline">
              Без live-данных по филиалам: {{ failedBranches.length }}
            </UBadge>
          </div>
        </template>

        <SharedSkeletonRows v-if="isBarbersInitialLoading" :rows="8" :columns="6" />

        <div v-else-if="barberRows.length" class="space-y-4">
          <div class="overflow-hidden rounded-[0.875rem] border border-charcoal-200 bg-white/90">
            <UTable
              :columns="columns"
              :data="paginatedBarbers"
              :loading="pending"
              :ui="{
                root: 'w-full overflow-auto',
                base: 'w-full min-w-[80rem]',
                thead: 'bg-charcoal-50/90',
                tbody: 'divide-y divide-charcoal-100',
                th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
                td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
              }"
            >
              <template #name-cell="{ row }">
                <div class="space-y-1">
                  <p class="font-semibold text-charcoal-950">
                    {{ row.original.name }}
                  </p>
                  <p class="text-xs text-charcoal-500">
                    {{ row.original.specialization || 'Специализация не указана' }}
                  </p>
                </div>
              </template>

              <template #branchName-cell="{ row }">
                <span class="font-medium text-charcoal-950">
                  {{ row.original.branchName }}
                </span>
              </template>

              <template #phone-cell="{ row }">
                {{ row.original.phone || 'Не указан' }}
              </template>

              <template #login-cell="{ row }">
                <div class="space-y-1">
                  <p class="font-medium text-charcoal-950">
                    {{ row.original.login || 'Не указан' }}
                  </p>
                  <p class="text-xs text-charcoal-500">
                    {{ row.original.role || 'Роль не указана' }}
                  </p>
                </div>
              </template>

              <template #isActive-cell="{ row }">
                <SharedStatusBadge :label="row.original.isActive === false ? 'inactive' : 'active'" />
              </template>

              <template #createdAt-cell="{ row }">
                {{ formatDateTime(row.original.createdAt) }}
              </template>

              <template #actions-cell="{ row }">
                <div class="flex justify-end">
                  <UButton
                    color="neutral"
                    icon="i-lucide-circle-ellipsis"
                    size="sm"
                    variant="outline"
                    @click="openDetails(row.original)"
                  >
                    Подробнее
                  </UButton>
                </div>
              </template>
            </UTable>
          </div>

          <div class="flex flex-col gap-3 border-t border-charcoal-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-charcoal-500">
              Показано {{ pageFrom }}-{{ pageTo }} из {{ barberRows.length }}
            </p>

            <UPagination
              v-model:page="page"
              active-color="primary"
              active-variant="solid"
              :items-per-page="itemsPerPage"
              :show-controls="true"
              :sibling-count="1"
              :total="barberRows.length"
            />
          </div>
        </div>

        <div
          v-else
          class="rounded-[0.875rem] border border-dashed border-charcoal-200 bg-white/70 px-5 py-6"
        >
          <p class="text-base font-semibold text-charcoal-950">
            Барберы не найдены
          </p>
          <p class="mt-2 text-sm text-charcoal-500">
            Не удалось собрать полный список барберов из аккаунтов и live-профилей.
          </p>
        </div>
      </UCard>

      <UModal
        v-model:open="detailModalOpen"
        class="sm:max-w-4xl"
        :description="detailDescription"
        :title="selectedBarber?.name || 'Детали барбера'"
      >
        <template #body>
          <div v-if="selectedBarber" class="space-y-6">
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div
                v-for="metric in detailMetrics"
                :key="metric.label"
                class="rounded-[0.875rem] border border-charcoal-200 bg-white/90 p-4"
              >
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                  {{ metric.label }}
                </p>
                <p class="mt-3 text-2xl font-semibold text-charcoal-950">
                  {{ metric.value }}
                </p>
                <p class="mt-2 text-sm leading-6 text-charcoal-500">
                  {{ metric.description }}
                </p>
              </div>
            </div>

            <div v-if="detailError" class="rounded-[0.875rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ detailError }}
            </div>

            <div v-if="detailPending" class="rounded-[0.875rem] border border-charcoal-200 bg-white/80 px-4 py-5 text-sm text-charcoal-500">
              Загружаю детальную статистику барбера...
            </div>

            <div class="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div class="rounded-[0.875rem] border border-charcoal-200 bg-white/90 p-5">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                  Профиль
                </p>
                <div class="mt-4 space-y-3">
                  <div
                    v-for="fact in detailFacts"
                    :key="fact.label"
                    class="flex items-start justify-between gap-4 border-b border-charcoal-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span class="text-sm text-charcoal-500">{{ fact.label }}</span>
                    <span class="text-right text-sm font-medium text-charcoal-950">{{ fact.value }}</span>
                  </div>
                </div>
              </div>

              <div class="rounded-[0.875rem] border border-charcoal-200 bg-white/90 p-5">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                  Дополнительные метрики
                </p>

                <div v-if="extraDetailRows.length" class="mt-4 space-y-3">
                  <div
                    v-for="[key, value] in extraDetailRows"
                    :key="key"
                    class="rounded-[0.75rem] border border-charcoal-100 bg-charcoal-50/60 px-4 py-3"
                  >
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-sm font-medium text-charcoal-700">{{ toKeyLabel(key) }}</span>
                      <span class="text-sm font-semibold text-charcoal-950">{{ value }}</span>
                    </div>
                    <div class="mt-3 h-2 rounded-full bg-sand-100">
                      <div
                        class="h-full rounded-full bg-brass-400"
                        :style="{ width: `${Math.min(asNumber(value, 0), 100)}%` }"
                      />
                    </div>
                  </div>
                </div>

                <p v-else class="mt-4 text-sm leading-6 text-charcoal-500">
                  API статистики не вернул дополнительных простых метрик сверх выручки, заказов и процента выполнения.
                </p>
              </div>
            </div>
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex w-full flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-charcoal-500">
              Период: {{ uiStore.statisticsRange.start }} - {{ uiStore.statisticsRange.end }}
            </p>

            <div class="flex flex-wrap justify-end gap-3">
              <UButton
                color="neutral"
                icon="i-lucide-refresh-cw"
                :loading="detailPending"
                variant="outline"
                @click="selectedBarber && loadBarberDetails(selectedBarber)"
              >
                Обновить детали
              </UButton>
              <UButton color="neutral" variant="ghost" @click="close">
                Закрыть
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
