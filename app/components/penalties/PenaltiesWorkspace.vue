<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { employeeRolePermissionPresets, type EmployeePermission } from '~~/shared/auth/employees'
import { formatMoney } from '~/utils/format'
import { calculateMinutePenalty } from '~/utils/penalty'

type Option = { label: string; value: string }
const ALL = '__all__'
type PenaltyRow = {
  id: string
  recipientId: string | null
  branchId: string | null
  date: string | null
  recipient: string
  amount: number
  comment: string | null
  branch: string
  creator: string
  canceled: boolean
  source: string
  lateMinutes: number | null
  scheduledStart: string | null
  actualAt: string | null
  graceMinutes: number | null
}

const session = useSessionStore()
const branches = useBranchStore()
const barbersApi = useBarbersApi()
const penaltiesApi = usePenaltiesApi()
const api = useApiClient()
const { data: penaltySettings } = await useVerifixPenalty()
await Promise.all([session.ensureLoaded(), branches.ensureLoaded()])

const role = computed(() => String(session.user?.role || '').toLowerCase())
const permissions = computed(() => {
  const explicit = session.user?.permissions
  if (Array.isArray(explicit) && explicit.length) return new Set(explicit as EmployeePermission[])
  return new Set(employeeRolePermissionPresets[role.value as keyof typeof employeeRolePermissionPresets] || [])
})
const canRead = computed(() => permissions.value.has('penalties.read'))
const canCreate = computed(() => permissions.value.has('penalties.create'))
const canCancel = computed(() => permissions.value.has('penalties.cancel'))
const canChooseBranch = computed(() => ['admin', 'super-manager', 'admin_network', 'admin_branch'].includes(role.value))
const period = ref('')
const branchFilter = ref(ALL)
const recipientFilter = ref(ALL)
const sourceFilter = ref(ALL)
const statusFilter = ref(ALL)
const modalOpen = ref(false)
const submitting = ref(false)
const form = reactive({ branch_id: '', recipient_id: '', amount: '', penalty_at: new Date().toISOString().slice(0, 10), comment: '' })

const branchOptions = computed<Option[]>(() => [
  { label: 'Все филиалы', value: ALL },
  ...branches.branches.map(branch => ({ label: branch.name || String(branch.id), value: String(branch.id) }))
])
const employeeQuery = computed(() => {
  if (modalOpen.value && form.branch_id) return { branch_id: form.branch_id }
  if (canChooseBranch.value) {
    return branchFilter.value !== ALL ? { branch_id: branchFilter.value } : {}
  }
  const ownBranchId = String(session.user?.branch_id || branches.activeBranchId || '')
  return ownBranchId ? { branch_id: ownBranchId } : {}
})
const { data: employeeData } = await useAsyncData('penalty-employees', () => barbersApi.list({ ...employeeQuery.value, archived: 'active' }), { default: () => ({ items: [] }), watch: [employeeQuery] })
const employeeOptions = computed<Option[]>(() => (employeeData.value?.items || []).map((item: any) => ({ label: item.name || item.login || item.id, value: String(item.id) })))
const recipientFilterOptions = computed<Option[]>(() => [{ label: 'Все сотрудники', value: ALL }, ...employeeOptions.value])
const sourceOptions: Option[] = [
  { label: 'Все типы', value: ALL },
  { label: 'Ручные штрафы', value: 'manual' },
  { label: 'За опоздание', value: 'late_minutes' }
]
const statusOptions: Option[] = [
  { label: 'Все статусы', value: ALL },
  { label: 'Активные', value: 'active' },
  { label: 'Отменённые', value: 'cancelled' }
]
watch(employeeOptions, (options) => {
  if (!options.some(option => option.value === form.recipient_id)) form.recipient_id = options[0]?.value || ''
})

const { data, pending, refresh } = await useAsyncData('penalties-list', () => {
  const query: Record<string, unknown> = {}
  if (period.value) query.period = period.value
  if (canChooseBranch.value && branchFilter.value !== ALL) query.branch_id = branchFilter.value
  if (canChooseBranch.value && branchFilter.value === ALL) query.__skipBranchScope = true
  if (recipientFilter.value !== ALL) query.recipient_id = recipientFilter.value
  if (sourceFilter.value !== ALL) query.source = sourceFilter.value
  if (statusFilter.value !== ALL) query.status = statusFilter.value
  return penaltiesApi.list(query)
}, { default: () => ({ items: [] }), watch: [period, branchFilter, recipientFilter, sourceFilter, statusFilter] })

function text(value: unknown) { const result = String(value ?? '').trim(); return result || null }
function money(value: unknown) { const result = Number(value ?? 0); return Number.isFinite(result) ? result : 0 }
function date(value: unknown) { const result = text(value); return result ? result.slice(0, 10) : null }
function displayDate(value: unknown) { const result = date(value); if (!result) return '—'; const [y, m, d] = result.split('-'); return `${d}.${m}.${y}` }
function displayDateTime(value: unknown) {
  const result = text(value)
  if (!result) return '—'
  const parsed = new Date(result)
  if (Number.isNaN(parsed.getTime())) return result
  return `${parsed.toLocaleDateString('ru-RU')} ${parsed.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
}
function extract(value: any): any[] { return Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : Array.isArray(value?.data) ? value.data : [] }
function rowAmount(item: any) {
  const amount = money(item.amount ?? item.total_amount)
  if (amount > 0) return amount
  const source = text(item.source || item.penalty_source)
  if (source !== 'late_minutes') return amount
  const minutes = Number(item.late_minutes ?? item.late_by_minutes)
  const rate = Number(penaltySettings.value?.penalty_per_minute ?? 0)
  return calculateMinutePenalty(minutes, rate)
}

const allRows = computed<PenaltyRow[]>(() => extract(data.value).map((item: any, index) => ({
  id: text(item.id) || `penalty-${index}`,
  recipientId: text(item.recipient?.id || item.recipient_id),
  branchId: text(item.branch?.id || item.branch_id),
  date: date(item.penalty_at || item.date || item.created_at),
  recipient: text(item.recipient?.name || item.recipient_name || item.recipient_id) || '—',
  amount: rowAmount(item),
  comment: text(item.comment),
  branch: text(item.branch?.name || item.branch_name) || '—',
  creator: text(item.creator?.name || item.creator?.login || item.created_by) || '—',
  canceled: item.canceled === true,
  source: text(item.source) || 'manual',
  lateMinutes: item.late_minutes == null ? null : Number(item.late_minutes),
  scheduledStart: item.scheduled_start_at || null,
  actualAt: item.occurred_at || null,
  graceMinutes: item.grace_minutes == null ? null : Number(item.grace_minutes)
})))

const rows = computed<PenaltyRow[]>(() => allRows.value.filter((row) => {
  if (canChooseBranch.value && branchFilter.value !== ALL && row.branchId !== branchFilter.value) return false
  if (recipientFilter.value !== ALL && row.recipientId !== recipientFilter.value) return false
  if (sourceFilter.value !== ALL && row.source !== sourceFilter.value) return false
  if (statusFilter.value === 'cancelled' && !row.canceled) return false
  if (statusFilter.value === 'active' && row.canceled) return false
  return true
}))
const totalAmount = computed(() => rows.value.reduce((sum, row) => sum + (row.canceled ? 0 : row.amount), 0))

const columns: TableColumn<PenaltyRow>[] = [
  { accessorKey: 'date', header: 'Дата' },
  { accessorKey: 'recipient', header: 'Кто получил' },
  { accessorKey: 'lateMinutes', header: 'Минуты' },
  { accessorKey: 'graceMinutes', header: 'Допуск' },
  { accessorKey: 'scheduledStart', header: 'Начало смены' },
  { accessorKey: 'actualAt', header: 'Фактический вход' },
  { accessorKey: 'amount', header: 'Сумма' },
  { accessorKey: 'comment', header: 'Комментарий' },
  { accessorKey: 'branch', header: 'Филиал' },
  { accessorKey: 'creator', header: 'Создал' },
  { id: 'actions', header: '' }
]

async function changeBranch(value: unknown) {
  const nextBranch = String(value || ALL)
  branchFilter.value = nextBranch
  recipientFilter.value = ALL
  await refresh()
}

function openCreate() {
  form.branch_id = canChooseBranch.value
    ? (branchFilter.value !== ALL ? branchFilter.value : String(branches.activeBranchId || branches.branches[0]?.id || ''))
    : ''
  form.recipient_id = employeeOptions.value[0]?.value || ''
  form.amount = ''
  form.penalty_at = new Date().toISOString().slice(0, 10)
  form.comment = ''
  modalOpen.value = true
}

async function submit() {
  const amount = money(form.amount)
  if (!form.recipient_id || amount <= 0 || !form.penalty_at) {
    api.notifyError(new Error('penalty fields are required'), 'Выберите сотрудника, дату и укажите сумму больше нуля.')
    return
  }
  submitting.value = true
  try {
    const payload: Record<string, unknown> = { recipient_id: form.recipient_id, amount, penalty_at: form.penalty_at, comment: text(form.comment) }
    if (canChooseBranch.value && form.branch_id) payload.branch_id = form.branch_id
    await penaltiesApi.create(payload)
    modalOpen.value = false
    await refresh()
  } finally { submitting.value = false }
}

async function cancel(row: PenaltyRow) {
  if (row.canceled || !canCancel.value) return
  if (import.meta.client && !window.confirm(`Отменить штраф для «${row.recipient}»?`)) return
  submitting.value = true
  try {
    await penaltiesApi.cancel(row.id)
    await refresh()
  } finally { submitting.value = false }
}
</script>

<template>
  <UDashboardPanel id="penalties">
    <template #header>
      <UDashboardNavbar title="Управление · Штрафы" :ui="{ right: 'gap-3' }">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">Обновить</UButton>
          <UButton v-if="canCreate" color="primary" icon="i-lucide-plus" @click="openCreate">Новый штраф</UButton>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <SharedEmptyState v-if="!canRead" title="Нет доступа к штрафам" description="Раздел доступен менеджерам и администраторам с соответствующим правом." icon="i-lucide-lock-keyhole" />
      <div v-else class="space-y-6">
        <UCard class="warm-card">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">Общая сумма активных штрафов</p>
          <p class="mt-2 text-2xl font-semibold text-error">{{ formatMoney(totalAmount) }}</p>
        </UCard>
        <UCard class="warm-card">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <UInput v-model="period" type="month" placeholder="Период" />
            <USelect v-if="canChooseBranch" :model-value="branchFilter" :items="branchOptions" value-key="value" class="w-full" placeholder="Все филиалы" @update:model-value="changeBranch" />
            <USelect v-model="recipientFilter" :items="recipientFilterOptions" value-key="value" class="w-full" :disabled="canChooseBranch && branchFilter === ALL" placeholder="Все сотрудники" />
            <USelect v-model="sourceFilter" :items="sourceOptions" value-key="value" class="w-full" placeholder="Все типы" />
            <USelect v-model="statusFilter" :items="statusOptions" value-key="value" class="w-full" placeholder="Все статусы" />
          </div>
        </UCard>
        <UCard class="warm-card">
          <div class="overflow-x-auto rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <UTable :columns="columns" :data="rows" :loading="pending" :ui="{ root: 'w-full overflow-auto', base: 'w-full min-w-[66rem]', th: 'whitespace-nowrap', td: 'whitespace-nowrap align-middle' }">
              <template #date-cell="{ row }">{{ displayDate(row.original.date) }}</template>
              <template #lateMinutes-cell="{ row }">{{ row.original.lateMinutes == null ? '—' : `${row.original.lateMinutes} мин.` }}</template>
              <template #graceMinutes-cell="{ row }">{{ row.original.graceMinutes == null ? '—' : `${row.original.graceMinutes} мин.` }}</template>
              <template #scheduledStart-cell="{ row }">{{ displayDateTime(row.original.scheduledStart) }}</template>
              <template #actualAt-cell="{ row }">{{ displayDateTime(row.original.actualAt) }}</template>
              <template #amount-cell="{ row }"><span class="font-semibold text-error">{{ formatMoney(row.original.amount) }}</span></template>
              <template #comment-cell="{ row }">{{ row.original.comment || '—' }}</template>
              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UBadge v-if="row.original.canceled" color="neutral" variant="subtle">Отменён</UBadge>
                  <UButton v-else-if="canCancel" icon="i-lucide-ban" color="error" size="xs" variant="ghost" :loading="submitting" @click="cancel(row.original)">Отменить</UButton>
                </div>
              </template>
            </UTable>
          </div>
          <p v-if="!pending && !rows.length" class="py-10 text-center text-sm text-charcoal-500">Штрафов пока нет.</p>
        </UCard>
      </div>
      <UModal v-model:open="modalOpen" class="sm:max-w-xl" title="Новый штраф">
        <template #body>
          <div class="space-y-4">
            <UFormField v-if="canChooseBranch" label="Филиал" required><USelect v-model="form.branch_id" :items="branchOptions.slice(1)" value-key="value" class="w-full" placeholder="Выберите филиал" /></UFormField>
            <UFormField label="Сотрудник" required><USelect v-model="form.recipient_id" :items="employeeOptions" value-key="value" class="w-full" placeholder="Выберите сотрудника" /></UFormField>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Дата" required><UInput v-model="form.penalty_at" type="date" /></UFormField>
              <UFormField label="Сумма" required><UInput v-model="form.amount" type="number" min="0.01" step="0.01" /></UFormField>
            </div>
            <UFormField label="Комментарий"><UTextarea v-model="form.comment" :rows="3" placeholder="Причина штрафа" /></UFormField>
          </div>
        </template>
        <template #footer><div class="flex w-full justify-end gap-3"><UButton color="neutral" variant="ghost" :disabled="submitting" @click="modalOpen = false">Отмена</UButton><UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submit">Сохранить</UButton></div></template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
