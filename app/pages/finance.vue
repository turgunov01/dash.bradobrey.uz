<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'

import { formatCount, formatMoney } from '~/utils/format'

type FinanceEmployeeDraft = {
  advances: number
  penalty: number
  profit: number
  profit_percent: number
  salary: number
}

type FinanceSnapshotPayload = {
  employees: Record<string, FinanceEmployeeDraft>
}

type FinanceEmployeeRow = {
  id: string
  login: string | null
  name: string
  role: string | null
}

type FinanceDraftStorage = Record<string, FinanceSnapshotPayload>

const branchStore = useBranchStore()
const barbersApi = useBarbersApi()
const financeApi = useFinanceApi()
const apiClient = useApiClient()

await branchStore.ensureLoaded()

function currentPeriodKey() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function normalizeNumber(value: unknown, fallback = 0) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : fallback
}

function createEmptyEmployeeDraft(): FinanceEmployeeDraft {
  return {
    advances: 0,
    penalty: 0,
    profit: 0,
    profit_percent: 0,
    salary: 0
  }
}

function normalizeEmployeeDraft(value: unknown): FinanceEmployeeDraft {
  if (!value || typeof value !== 'object') {
    return createEmptyEmployeeDraft()
  }

  const source = value as Partial<FinanceEmployeeDraft>

  return {
    advances: Math.max(0, normalizeNumber(source.advances)),
    penalty: Math.max(0, normalizeNumber(source.penalty)),
    profit: Math.max(0, normalizeNumber(source.profit)),
    profit_percent: Math.max(0, normalizeNumber(source.profit_percent)),
    salary: Math.max(0, normalizeNumber(source.salary))
  }
}

function normalizePayload(value: unknown): FinanceSnapshotPayload {
  if (!value || typeof value !== 'object') {
    return { employees: {} }
  }

  const source = value as Partial<FinanceSnapshotPayload>
  const employeesSource = source.employees && typeof source.employees === 'object'
    ? source.employees as Record<string, unknown>
    : {}

  const employees: Record<string, FinanceEmployeeDraft> = {}

  for (const [id, draft] of Object.entries(employeesSource)) {
    const key = String(id || '').trim()

    if (!key) {
      continue
    }

    employees[key] = normalizeEmployeeDraft(draft)
  }

  return { employees }
}

function clonePayload(value: FinanceSnapshotPayload): FinanceSnapshotPayload {
  try {
    return JSON.parse(JSON.stringify(value)) as FinanceSnapshotPayload
  }
  catch {
    return normalizePayload(value)
  }
}

function buildEmployeeTitle(item: Record<string, any>) {
  const name = String(item?.name || '').trim()
  const login = String(item?.login || '').trim()

  return name || login || `Сотрудник ${String(item?.id || '').slice(0, 6)}`
}

const period = ref(currentPeriodKey())
const periodKey = computed(() => (/^\d{4}-\d{2}$/.test(period.value) ? period.value : currentPeriodKey()))
const saving = ref(false)
const remoteLoading = ref(false)
const remoteError = ref<unknown>(null)
const hasLocalDraft = ref(false)
const dirty = ref(false)

const draftsStorage = useStorage<FinanceDraftStorage>('finance-drafts', {}, undefined, {
  deep: true,
  listenToStorageChanges: false
})

const storageKey = computed(() => `${branchStore.activeBranchId || 'global'}:${periodKey.value}`)
const payload = ref<FinanceSnapshotPayload>({ employees: {} })

watch(storageKey, (key) => {
  const stored = draftsStorage.value?.[key]
  hasLocalDraft.value = Boolean(stored)
  dirty.value = false
  payload.value = normalizePayload(stored)
}, { immediate: true })

watch(payload, (value) => {
  draftsStorage.value[storageKey.value] = clonePayload(value)
}, { deep: true })

function getEmployeeDraft(id: string): FinanceEmployeeDraft {
  const key = String(id || '').trim()

  if (!key) {
    return createEmptyEmployeeDraft()
  }

  const existing = payload.value.employees[key]

  if (existing) {
    return existing
  }

  const created = createEmptyEmployeeDraft()
  payload.value.employees[key] = created

  return created
}

function commissionForDraft(draft: FinanceEmployeeDraft) {
  return Math.round((draft.profit * draft.profit_percent) / 100)
}

function totalForDraft(draft: FinanceEmployeeDraft) {
  return draft.salary + commissionForDraft(draft) - draft.advances - draft.penalty
}

async function loadRemoteSnapshot(options: { overwrite?: boolean } = {}) {
  remoteLoading.value = true
  remoteError.value = null

  try {
    const snapshot = await financeApi.snapshot({ period: periodKey.value }, { silent: true })

    if (options.overwrite || (!hasLocalDraft.value && !dirty.value)) {
      payload.value = normalizePayload(snapshot?.payload)
      dirty.value = false
    }
  }
  catch (error) {
    remoteError.value = error
  }
  finally {
    remoteLoading.value = false
  }
}

watch([() => branchStore.activeBranchId, periodKey], async () => {
  await loadRemoteSnapshot()
}, { immediate: true })

const remoteNeedsMigration = computed(() => {
  const error = remoteError.value as any
  const code = error?.statusCode || error?.response?.status

  return code === 501
})

async function saveToRemote() {
  const branchId = branchStore.activeBranchId

  if (!branchId) {
    apiClient.notifyError(new Error('Не выбран филиал.'))
    return
  }

  if (!/^\d{4}-\d{2}$/.test(period.value)) {
    apiClient.notifyError(new Error('Укажите период в формате YYYY-MM.'))
    return
  }

  saving.value = true

  try {
    await financeApi.upsert({
      branch_id: branchId,
      payload: payload.value,
      period: periodKey.value
    })

    dirty.value = false
    hasLocalDraft.value = true
    await loadRemoteSnapshot()
  }
  finally {
    saving.value = false
  }
}

async function refreshAll() {
  await Promise.allSettled([
    refreshEmployees(),
    loadRemoteSnapshot()
  ])
}

function resetDraft() {
  dirty.value = true
  payload.value = { employees: {} }
}

const { data: employeeItems, pending: employeesPending, refresh: refreshEmployees } = await useAsyncData('finance-employees', async () => {
  const response = await barbersApi.list({ mode: 'employees' })
  return Array.isArray(response?.items) ? response.items : []
}, {
  watch: [() => branchStore.activeBranchId]
})

const employees = computed<FinanceEmployeeRow[]>(() =>
  (employeeItems.value || [])
    .map((item) => ({
      id: String(item.id),
      login: item.login ? String(item.login).trim() : null,
      name: buildEmployeeTitle(item as any),
      role: item.role ? String(item.role).trim() : null
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
)

const totals = computed(() => {
  let salary = 0
  let profit = 0
  let advances = 0
  let penalties = 0
  let commission = 0
  let payout = 0

  for (const employee of employees.value) {
    const draft = getEmployeeDraft(employee.id)

    salary += draft.salary
    profit += draft.profit
    advances += draft.advances
    penalties += draft.penalty

    const earned = commissionForDraft(draft)
    commission += earned
    payout += draft.salary + earned - draft.advances - draft.penalty
  }

  return {
    advances,
    commission,
    payout,
    penalties,
    profit,
    salary
  }
})

const columns: TableColumn<FinanceEmployeeRow>[] = [
  { accessorKey: 'name', header: 'Сотрудник' },
  { id: 'salary', header: 'Оклад' },
  { id: 'profit', header: 'Прибыль' },
  { id: 'profitPercent', header: '% с прибыли' },
  { id: 'advances', header: 'Авансы' },
  { id: 'penalty', header: 'Штраф' },
  { id: 'commission', header: 'С прибыли' },
  { id: 'total', header: 'К выплате' }
]
</script>

<template>
  <UDashboardPanel id="finance">
    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge color="neutral" size="lg" variant="soft">
            {{ formatCount(employees.length) }} сотрудников
          </UBadge>
          <UBadge color="primary" size="lg" variant="soft">
            Итого: {{ formatMoney(totals.payout) }}
          </UBadge>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UInput v-model="period" type="month" size="sm" class="w-[9.5rem]" />
          <UButton color="primary" icon="i-lucide-save" :loading="saving" @click="saveToRemote">
            Сохранить
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-rotate-ccw"
            :disabled="saving || employeesPending"
            @click="resetDraft"
          >
            Сбросить
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="employeesPending || remoteLoading"
            @click="refreshAll"
          >
            Обновить
          </UButton>
        </div>
      </div>

      <UAlert
        v-if="remoteNeedsMigration"
        color="warning"
        icon="i-lucide-database-zap"
        title="Нет таблицы finance_snapshots в Supabase"
        description="Данные сохраняются локально в браузере. Чтобы включить синхронизацию, создайте таблицу finance_snapshots и повторите сохранение."
        class="mb-4"
      />

      <div class="grid gap-3 pb-4 md:grid-cols-5">
        <UCard class="warm-card rounded-[1.25rem] border border-charcoal-200 bg-white/90 md:col-span-5">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                Оклад
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.salary) }}
              </p>
            </div>
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                Прибыль
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.profit) }}
              </p>
            </div>
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                С прибыли
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.commission) }}
              </p>
            </div>
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                Авансы
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.advances) }}
              </p>
            </div>
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">
                Штрафы
              </p>
              <p class="mt-2 text-lg font-semibold text-charcoal-950">
                {{ formatMoney(totals.penalties) }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <SharedEmptyState
        v-if="!employeesPending && !employees.length"
        title="Нет сотрудников"
        description="Добавьте сотрудников в разделе «Сотрудники», чтобы заполнять финансы."
        icon="i-lucide-users"
      />

      <div v-else class="flex flex-col max-h-[70vh] overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
        <div class="flex-1 overflow-auto">
          <UTable
            :columns="columns"
            :data="employees"
            :loading="employeesPending"
            sticky="header"
            :ui="{
              root: 'w-full overflow-auto',
              base: 'w-full min-w-[72rem]',
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
                <p v-if="row.original.login" class="text-xs text-charcoal-500">
                  @{{ row.original.login }}
                </p>
              </div>
            </template>

            <template #salary-cell="{ row }">
              <UInput
                v-model.number="getEmployeeDraft(row.original.id).salary"
                type="number"
                min="0"
                size="sm"
                class="w-32"
                @update:model-value="dirty = true"
              />
            </template>

            <template #profit-cell="{ row }">
              <UInput
                v-model.number="getEmployeeDraft(row.original.id).profit"
                type="number"
                min="0"
                size="sm"
                class="w-32"
                @update:model-value="dirty = true"
              />
            </template>

            <template #profitPercent-cell="{ row }">
              <UInput
                v-model.number="getEmployeeDraft(row.original.id).profit_percent"
                type="number"
                min="0"
                step="0.1"
                size="sm"
                class="w-28"
                @update:model-value="dirty = true"
              />
            </template>

            <template #advances-cell="{ row }">
              <UInput
                v-model.number="getEmployeeDraft(row.original.id).advances"
                type="number"
                min="0"
                size="sm"
                class="w-32"
                @update:model-value="dirty = true"
              />
            </template>

            <template #penalty-cell="{ row }">
              <UInput
                v-model.number="getEmployeeDraft(row.original.id).penalty"
                type="number"
                min="0"
                size="sm"
                class="w-32"
                @update:model-value="dirty = true"
              />
            </template>

            <template #commission-cell="{ row }">
              <span class="font-semibold text-charcoal-950">
                {{ formatMoney(commissionForDraft(getEmployeeDraft(row.original.id))) }}
              </span>
            </template>

            <template #total-cell="{ row }">
              <span class="font-semibold text-charcoal-950">
                {{ formatMoney(totalForDraft(getEmployeeDraft(row.original.id))) }}
              </span>
            </template>
          </UTable>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
