<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { employeeRolePermissionPresets, type EmployeePermission } from '~~/shared/auth/employees'
import { formatMoney } from '~/utils/format'

type Option = { label: string; value: string }
const ALL_OPTION_VALUE = '__all__'
type ExpenseRow = {
  id: string
  amount: number
  category: string
  comment: string | null
  created_at: string | null
  created_by: string | null
  branch_id: string | null
  branch: string
  can_edit: boolean
  name: string
}

const props = withDefaults(defineProps<{ barberMode?: boolean }>(), { barberMode: false })
const sessionStore = useSessionStore()
const branchStore = useBranchStore()
const expensesApi = useExpensesApi()
const warehouseApi = useWarehouseApi()
const apiClient = useApiClient()

await Promise.all([sessionStore.ensureLoaded(), branchStore.ensureLoaded()])

function text(value: unknown) {
  const result = String(value ?? '').trim()
  return result || null
}

function number(value: unknown) {
  const result = Number(value ?? 0)
  return Number.isFinite(result) ? result : 0
}

function extractItems(value: unknown): Record<string, any>[] {
  if (Array.isArray(value)) return value as Record<string, any>[]
  if (!value || typeof value !== 'object') return []
  const source = value as Record<string, any>
  for (const key of ['items', 'data', 'rows', 'records', 'categories', 'expenses']) {
    if (Array.isArray(source[key])) return source[key]
  }
  return source.data && typeof source.data === 'object' ? extractItems(source.data) : []
}

function currentDate() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function dateOnly(value: unknown) {
  const result = text(value)
  return result ? result.slice(0, 10) : null
}

function displayDate(value: unknown) {
  const result = dateOnly(value)
  if (!result) return '—'
  const [year, month, day] = result.split('-')
  return `${day}.${month}.${year}`
}

const role = computed(() => String(sessionStore.user?.role || '').trim().toLowerCase())
const permissions = computed(() => {
  const explicit = sessionStore.user?.permissions
  if (Array.isArray(explicit) && explicit.length) return new Set(explicit as EmployeePermission[])
  return new Set(employeeRolePermissionPresets[role.value as keyof typeof employeeRolePermissionPresets] || [])
})
const canRead = computed(() => permissions.value.has('expenses.read'))
const canCreate = computed(() => permissions.value.has('expenses.create'))
const canUpdate = computed(() => permissions.value.has('expenses.update'))
const canDelete = computed(() => permissions.value.has('expenses.delete'))
const canChooseBranch = computed(() => !props.barberMode && ['admin', 'super-manager', 'admin_network'].includes(role.value))

const period = ref('')
const categoryFilter = ref(ALL_OPTION_VALUE)
const branchFilter = ref(ALL_OPTION_VALUE)
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const submitting = ref(false)

const form = reactive({
  amount: '',
  branch_id: '',
  category: '',
  comment: '',
  name: '',
  spent_at: currentDate()
})

const { data: categoryData } = await useAsyncData('warehouse-categories-options', () => warehouseApi.categories(), {
  default: () => ({ items: [] })
})
const { data, pending, refresh } = await useAsyncData('expenses-list', () => {
  const query: Record<string, unknown> = {}
  if (period.value) query.period = period.value
  if (categoryFilter.value !== ALL_OPTION_VALUE) query.category = categoryFilter.value
  if (canChooseBranch.value && branchFilter.value !== ALL_OPTION_VALUE) query.branch_id = branchFilter.value
  if (canChooseBranch.value && branchFilter.value === ALL_OPTION_VALUE) query.__skipBranchScope = true
  return expensesApi.list(query)
}, {
  default: () => ({ items: [] }),
  watch: [period, categoryFilter, branchFilter]
})

const categoryOptions = computed<Option[]>(() => {
  const options = extractItems(categoryData.value)
    .map(item => text(item.name || item.title))
    .filter((name): name is string => Boolean(name))
    .map(name => ({ label: name, value: name }))

  return options.length ? options : [{ label: 'Прочее', value: 'Прочее' }]
})
const branchOptions = computed<Option[]>(() => [
  { label: 'Все филиалы', value: ALL_OPTION_VALUE },
  ...branchStore.branches.map(branch => ({ label: branch.name || String(branch.id), value: String(branch.id) }))
])

const rows = computed<ExpenseRow[]>(() => extractItems(data.value).map((item, index) => {
  const branchId = text(item.branch_id || item.branchId || item.object_id || item.objectId)
  const id = text(item.id || item.expense_id) || `expense-${index}`
  const branch = branchStore.branches.find(entry => String(entry.id) === branchId)

  return {
    amount: number(item.amount || item.total_amount || item.totalAmount),
    branch: text(item.branch_name || item.branchName || item.branch?.name) || branch?.name || branchId || '—',
    branch_id: branchId,
    can_edit: item.can_edit !== false,
    category: text(item.category || item.category_name || item.categoryName) || 'Прочее',
    comment: text(item.comment || item.description || item.note),
    created_at: dateOnly(item.spent_at || item.date || item.created_at || item.createdAt),
    created_by: text(
      item.creator?.name
      || item.creator?.login
      || item.created_by_name
      || item.createdByName
      || item.created_by
      || item.createdBy
    ),
    id,
    name: text(item.name || item.title) || 'Расход'
  }
}))

const columns: TableColumn<ExpenseRow>[] = [
  { accessorKey: 'created_at', header: 'Дата' },
  { accessorKey: 'category', header: 'Категория' },
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'amount', header: 'Сумма' },
  { accessorKey: 'comment', header: 'Комментарий' },
  { accessorKey: 'branch', header: 'Филиал' },
  { accessorKey: 'created_by', header: 'Создал' },
  { id: 'actions', header: '' }
]

function resetForm() {
  form.amount = ''
  form.branch_id = branchStore.activeBranchId || branchStore.branches[0]?.id || ''
  form.category = categoryOptions.value[0]?.value || ''
  form.comment = ''
  form.name = ''
  form.spent_at = currentDate()
}

function openCreate() {
  editingId.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row: ExpenseRow) {
  editingId.value = row.id
  form.amount = String(row.amount)
  form.branch_id = row.branch_id || branchStore.activeBranchId || ''
  form.category = row.category
  form.comment = row.comment || ''
  form.name = row.name
  form.spent_at = row.created_at?.slice(0, 10) || currentDate()
  modalOpen.value = true
}

async function submit() {
  const amount = number(form.amount)
  const name = text(form.name)
  const category = text(form.category)
  const spentAt = text(form.spent_at)

  if (amount <= 0 || !name || !category || !spentAt) {
    apiClient.notifyError(new Error('expense fields are required'), 'Укажите название, категорию, дату и сумму больше нуля.')
    return
  }

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      amount,
      category,
      comment: text(form.comment),
      name,
      spent_at: spentAt
    }
    if (canChooseBranch.value && form.branch_id) payload.branch_id = form.branch_id

    if (editingId.value) await expensesApi.update(editingId.value, payload)
    else await expensesApi.create(payload)

    modalOpen.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

async function remove(row: ExpenseRow) {
  if (import.meta.client && !window.confirm(`Удалить расход «${row.name}»?`)) return
  submitting.value = true
  try {
    await expensesApi.remove(row.id)
    await refresh()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel :id="barberMode ? 'barber-expenses' : 'warehouse-expenses'">
    <template #header>
      <UDashboardNavbar :title="barberMode ? 'Расходы филиала' : 'Склад · Расходы'" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
          <UButton v-if="canCreate" color="primary" icon="i-lucide-plus" @click="openCreate">
            Новый расход
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <SharedEmptyState
        v-if="!canRead"
        title="Нет доступа к расходам"
        description="Раздел доступен менеджерам и администраторам с соответствующим правом."
        icon="i-lucide-lock-keyhole"
      />
      <div v-else class="space-y-6">
        <UCard class="warm-card">
          <div class="grid gap-3 sm:grid-cols-3">
            <UInput v-model="period" type="month" placeholder="Период" />
            <USelect
              v-model="categoryFilter"
              :items="[{ label: 'Все категории', value: ALL_OPTION_VALUE }, ...categoryOptions]"
              value-key="value"
              class="w-full"
              placeholder="Все категории"
            />
            <USelect
              v-if="canChooseBranch"
              v-model="branchFilter"
              :items="branchOptions"
              value-key="value"
              class="w-full"
              placeholder="Все филиалы"
            />
          </div>
        </UCard>

        <UCard class="warm-card">
          <div class="overflow-x-auto rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <UTable
              :columns="columns"
              :data="rows"
              :loading="pending"
              :ui="{ root: 'w-full overflow-auto', base: 'w-full min-w-[72rem]', th: 'whitespace-nowrap', td: 'whitespace-nowrap align-middle' }"
            >
              <template #created_at-cell="{ row }">{{ displayDate(row.original.created_at) }}</template>
              <template #amount-cell="{ row }"><span class="font-semibold text-charcoal-950">{{ formatMoney(row.original.amount) }}</span></template>
              <template #comment-cell="{ row }">{{ row.original.comment || '—' }}</template>
              <template #actions-cell="{ row }">
                <div class="flex justify-end gap-2">
                  <UButton v-if="canUpdate && row.original.can_edit" icon="i-lucide-pencil" size="xs" variant="ghost" @click="openEdit(row.original)" />
                  <UButton v-if="canDelete" icon="i-lucide-trash-2" color="error" size="xs" variant="ghost" :loading="submitting" @click="remove(row.original)" />
                </div>
              </template>
            </UTable>
          </div>
          <p v-if="!pending && !rows.length" class="py-10 text-center text-sm text-charcoal-500">Расходов пока нет.</p>
        </UCard>
      </div>

      <UModal v-model:open="modalOpen" class="sm:max-w-xl" :title="editingId ? 'Редактировать расход' : 'Новый расход'">
        <template #body>
          <div class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Дата" required><UInput v-model="form.spent_at" type="date" /></UFormField>
              <UFormField label="Сумма" required><UInput v-model="form.amount" type="number" min="0.01" step="0.01" /></UFormField>
            </div>
            <UFormField label="Категория" required><USelect v-model="form.category" :items="categoryOptions" value-key="value" class="w-full" placeholder="Выберите категорию" /></UFormField>
            <UFormField label="Название" required><UInput v-model="form.name" placeholder="Например, ремонт оборудования" /></UFormField>
            <UFormField v-if="canChooseBranch" label="Филиал" required><USelect v-model="form.branch_id" :items="branchOptions.slice(1)" value-key="value" class="w-full" placeholder="Выберите филиал" /></UFormField>
            <UFormField label="Комментарий"><UTextarea v-model="form.comment" :rows="3" /></UFormField>
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="modalOpen = false">Отмена</UButton>
            <UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submit">Сохранить</UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
