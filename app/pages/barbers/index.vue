<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'

import { formatCount, formatDateTime, formatMoney } from '~/utils/format'
import { flattenServicesPayload } from '~/utils/services'
import {
  employeePermissionDefinitions,
  employeePermissionSections,
  employeeRoleLabels,
  employeeRolePermissionPresets,
  getEmployeeRoleLabel,
  type EmployeePermission,
  type EmployeeRole
} from '~~/shared/auth/employees'
import { barberRegisterSchema, barberUpdateSchema } from '~~/shared/schemas'

const apiClient = useApiClient();
const config = useRuntimeConfig();

type EmployeeRow = {
  branch: string
  branch_id: string
  id: string
  login: string
  name: string
  permissions: EmployeePermission[]
  photo_url: string | null
  phone: string | null
  role: string
  specialization: string | null
}

type FinanceEmployeeDraft = {
  advances: number
  bonus_profit_percent: number
  penalty: number
  profit: number
  profit_percent: number
  salary: number
}

type FinanceSnapshotPayload = {
  employees: Record<string, FinanceEmployeeDraft>
}

type FinanceDraftStorage = Record<string, FinanceSnapshotPayload>

const roleDescriptions: Record<EmployeeRole, string> = {
  admin: 'Полный контроль над настройками, сотрудниками и внутренними разделами.',
  barber: 'Рабочее место мастера, своя очередь, своя история и личная статистика.',
  manager: 'Операционное управление филиалом, услугами, клиентами и аналитикой филиала.',
  'super-barber': 'Расширенный мастер с доступом к очереди филиала и более широким операциям.',
  'super-manager': 'Старший менеджер с расширенными правами на сотрудников и маркетинговые разделы.'
}

const branchStore = useBranchStore()
const barbersApi = useBarbersApi()
const financeApi = useFinanceApi()
const historyApi = useHistoryApi()
const kioskApi = useKioskApi()
const financeDraftsStorage = useStorage<FinanceDraftStorage>('finance-drafts', {}, undefined, {
  deep: true,
  listenToStorageChanges: true
})

await branchStore.ensureLoaded()

const formModalOpen = ref(false)
const detailsModalOpen = ref(false)
const isSyncingRolePreset = ref(false)
const submitting = ref(false)
const removingId = ref('')
const editingId = ref('')
const selectedEmployeeId = ref('')
const avatarFile = ref<File | null>(null)
const avatarObjectUrl = ref('')

const form = reactive({
  branch_id: branchStore.activeBranchId || '',
  login: '',
  name: '',
  password: '',
  permissions: [...employeeRolePermissionPresets.barber] as EmployeePermission[],
  photo_url: '',
  phone: '',
  role: 'barber' as EmployeeRole,
  specialization: ''
})

const fieldErrors = reactive<Record<string, string>>({})

const isEditing = computed(() => Boolean(editingId.value))
const modalTitle = computed(() => isEditing.value ? 'Редактировать сотрудника' : 'Создать сотрудника')
const modalDescription = computed(() =>
  isEditing.value
    ? 'Обновите профиль, роль и набор прав выбранного сотрудника.'
    : 'Заполните данные нового сотрудника и настройте доступы через свитчи.'
)
const submitLabel = computed(() => isEditing.value ? 'Сохранить сотрудника' : 'Создать сотрудника')
const submitIcon = computed(() => isEditing.value ? 'i-lucide-save' : 'i-lucide-user-plus')
const passwordPlaceholder = computed(() =>
  isEditing.value
    ? 'Оставьте пустым, чтобы не менять пароль'
    : 'минимум 6 символов'
)

const branchOptions = computed(() =>
  branchStore.branches.map(branch => ({
    label: branch.name,
    value: branch.id
  }))
)

const roleOptions = computed(() =>
  Object.entries(employeeRoleLabels).map(([value, label]) => ({
    description: roleDescriptions[value as EmployeeRole],
    label,
    value
  }))
)
const roleFilterOptions = computed(() => [
  { label: 'Все роли', value: 'all' },
  ...roleOptions.value
])

const branchMap = computed(() =>
  new Map(branchStore.branches.map(branch => [branch.id, branch.name]))
)

function currentPeriodKey() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function currentPeriodRange() {
  const [yearPart, monthPart] = currentPeriodKey().split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)
  const lastDay = new Date(year, month, 0).getDate()

  return {
    end_date: `${yearPart}-${monthPart}-${String(lastDay).padStart(2, '0')}`,
    start_date: `${yearPart}-${monthPart}-01`
  }
}

function normalizeNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, number) : 0
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()

  return text || null
}

function extractHistoryItems(response: unknown): Record<string, any>[] {
  if (Array.isArray(response)) {
    return response as Record<string, any>[]
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    data?: Record<string, any>[] | { items?: Record<string, any>[] }
    items?: Record<string, any>[]
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.data?.items)) {
    return payload.data.items
  }

  return []
}

function normalizeFinanceDraft(value: unknown): FinanceEmployeeDraft {
  const source = value && typeof value === 'object' ? value as Partial<FinanceEmployeeDraft> : {}

  return {
    advances: normalizeNumber(source.advances),
    bonus_profit_percent: normalizeNumber(source.bonus_profit_percent),
    penalty: normalizeNumber(source.penalty),
    profit: normalizeNumber(source.profit),
    profit_percent: normalizeNumber(source.profit_percent),
    salary: normalizeNumber(source.salary)
  }
}

function normalizeFinancePayload(value: unknown): FinanceSnapshotPayload {
  const source = value && typeof value === 'object' ? value as Partial<FinanceSnapshotPayload> : {}
  const employeesSource = source.employees && typeof source.employees === 'object'
    ? source.employees as Record<string, unknown>
    : {}
  const employees: Record<string, FinanceEmployeeDraft> = {}

  for (const [id, draft] of Object.entries(employeesSource)) {
    const key = String(id || '').trim()

    if (key) {
      employees[key] = normalizeFinanceDraft(draft)
    }
  }

  return { employees }
}

function hasFinanceDraftValues(draft: FinanceEmployeeDraft) {
  return Object.values(draft).some(value => value > 0)
}

function hasManualFinanceDraftValues(draft: FinanceEmployeeDraft) {
  return [
    draft.advances,
    draft.bonus_profit_percent,
    draft.penalty,
    draft.profit_percent,
    draft.salary
  ].some(value => value > 0)
}

function getLocalFinanceDraft(employeeId: string, branchId?: string | null) {
  const period = currentPeriodKey()
  const keys = [
    branchId ? `${branchId}:${period}` : null,
    branchStore.activeBranchId ? `${branchStore.activeBranchId}:${period}` : null,
    `global:${period}`
  ].filter((key, index, list): key is string => Boolean(key) && list.indexOf(key) === index)

  for (const key of keys) {
    const draft = normalizeFinancePayload(financeDraftsStorage.value?.[key]).employees[employeeId]

    if (draft && hasFinanceDraftValues(draft)) {
      return draft
    }
  }

  return null
}

function resolveFinanceDraft(remoteValue: unknown, employeeId: string, branchId?: string | null) {
  const remoteDraft = normalizeFinanceDraft(remoteValue)
  const localDraft = getLocalFinanceDraft(employeeId, branchId)

  if (!localDraft) {
    return remoteDraft
  }

  if (hasManualFinanceDraftValues(localDraft) || !hasManualFinanceDraftValues(remoteDraft)) {
    return localDraft
  }

  return remoteDraft
}

function commissionForDraft(draft: FinanceEmployeeDraft, fallbackProfit: number) {
  const profit = draft.profit > 0 ? draft.profit : fallbackProfit
  const goal = draft.salary
  const basePercent = draft.profit_percent
  const bonusPercent = draft.bonus_profit_percent > 0 ? draft.bonus_profit_percent : basePercent
  const profitToGoal = goal > 0 ? Math.min(profit, goal) : 0
  const profitAboveGoal = Math.max(0, profit - profitToGoal)

  return Math.round(
    (profitToGoal * basePercent) / 100
    + (profitAboveGoal * bonusPercent) / 100
  )
}

function getHistoryBarberId(item: Record<string, any>) {
  return normalizeText(item.barber_id)
    || normalizeText(item.barberId)
    || normalizeText(item.completed_by_barber_id)
    || normalizeText(item.completedByBarberId)
    || normalizeText(item.barber?.id)
    || normalizeText(item.barber?.user_id)
    || normalizeText(item.barber?.userId)
    || normalizeText(item.completed_by_barber?.id)
    || normalizeText(item.completedByBarber?.id)
}

function getHistoryTimestamp(item: Record<string, any>) {
  const value = normalizeText(
    item.completed_at
    || item.completedAt
    || item.finished_at
    || item.finishedAt
    || item.created_at
    || item.createdAt
  )

  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function isCompletedStatus(value: unknown) {
  return ['completed', 'done', 'paid'].includes(String(value || '').trim().toLowerCase())
}

function isCancelledStatus(value: unknown) {
  return ['cancelled', 'no_show', 'not_in_time', 'rejected'].includes(String(value || '').trim().toLowerCase())
}

function isFinalHistoryStatus(value: unknown) {
  return isCompletedStatus(value) || isCancelledStatus(value)
}

function getHistoryServiceIds(item: Record<string, any>) {
  const ids: unknown[] = []

  if (item.service_id) {
    ids.push(item.service_id)
  }

  if (Array.isArray(item.service_ids)) {
    ids.push(...item.service_ids)
  }

  return [...new Set(ids.map(id => String(id || '').trim()).filter(Boolean))]
}

function getHistoryAmount(item: Record<string, any>, priceByServiceId: Map<string, number>) {
  const directAmount = [
    item.amount,
    item.order_total,
    item.total_amount,
    item.price_override,
    item.price
  ].map(normalizeNumber).find(amount => amount > 0)

  if (directAmount) {
    return directAmount
  }

  return getHistoryServiceIds(item).reduce((sum, serviceId) => sum + (priceByServiceId.get(serviceId) || 0), 0)
}

const columns: TableColumn<EmployeeRow>[] = [
  { accessorKey: 'login', header: 'Логин' },
  { accessorKey: 'name', header: 'Сотрудник' },
  { accessorKey: 'phone', header: 'Телефон' },
  { accessorKey: 'branch', header: 'Филиал' },
  { accessorKey: 'role', header: 'Роль' },
  { accessorKey: 'permissions', header: 'Доступы' },
  { id: 'actions', header: '' }
]

const page = ref(1)
const pageSize = 10
const searchLogin = ref('')
const roleFilter = ref<'all' | EmployeeRole>('all')

const { data, pending, refresh } = await useAsyncData('employees-directory', async () => {
  const response = await barbersApi.list({
    ...(branchStore.activeBranchId ? { branch_id: branchStore.activeBranchId } : {}),
    mode: 'employees'
  })

  const items = Array.isArray(response?.items) ? response.items : []
  const rows: EmployeeRow[] = items.map((item) => {
    const branchId = String(item.branch_id || '')
    const login = item.login || 'Без логина'
    const role = String(item.role || 'barber')
    const permissions = Array.isArray(item.permissions) ? item.permissions : []

    return {
      branch: branchMap.value.get(branchId) || 'Не указан',
      branch_id: branchId,
      id: String(item.id),
      login,
      name: item.name || login || 'Сотрудник без имени',
      permissions,
      photo_url: item.photo_url || null,
      phone: item.phone || null,
      role,
      specialization: item.specialization || null
    }
  })

  return { rows }
}, {
  watch: [() => branchStore.activeBranchId]
})

const { data: insightsData, pending: insightsPending, refresh: refreshInsights } = await useAsyncData('employees-insights', async () => {
  const branchId = branchStore.activeBranchId || undefined
  const range = currentPeriodRange()

  const [historyResult, servicesResult, financeResult] = await Promise.allSettled([
    branchId
      ? historyApi.branch(branchId, range)
      : historyApi.list(range),
    kioskApi.services({ active: true, grouped: true, ...(branchId ? { branch_id: branchId } : {}) }),
    branchId
      ? financeApi.snapshot({ branch_id: branchId, object_id: branchId, period: currentPeriodKey() }, { silent: true })
      : Promise.resolve(null)
  ])

  const financePayload = financeResult.status === 'fulfilled'
    ? normalizeFinancePayload(financeResult.value?.payload)
    : { employees: {} }

  return {
    financePayload,
    historyItems: historyResult.status === 'fulfilled' ? extractHistoryItems(historyResult.value) : [],
    services: servicesResult.status === 'fulfilled' ? flattenServicesPayload(servicesResult.value) : []
  }
}, {
  server: false,
  watch: [() => branchStore.activeBranchId]
})

const employeeRows = computed<EmployeeRow[]>(() => data.value?.rows || [])
const filteredRows = computed<EmployeeRow[]>(() => {
  const loginNeedle = searchLogin.value.trim().toLowerCase()

  return employeeRows.value.filter((row) => {
    const matchesLogin = !loginNeedle || row.login.toLowerCase().includes(loginNeedle)
    const matchesRole = roleFilter.value === 'all' || row.role === roleFilter.value
    return matchesLogin && matchesRole
  })
})
const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredRows.value.slice(start, start + pageSize)
})
const servicePriceMap = computed(() =>
  new Map(
    (insightsData.value?.services || []).map((service: any) => [
      String(service.id),
      normalizeNumber(service.base_price ?? service.price)
    ])
  )
)
const employeeInsightMap = computed(() => {
  const map = new Map<string, {
    cancelled: number
    completed: number
    finance: FinanceEmployeeDraft & {
      commission: number
      payout: number
      reportProfit: number
    }
    history: Record<string, any>[]
    periodRevenue: number
    revenue: number
    visits: number
  }>()
  const range = currentPeriodRange()
  const financeEmployees = insightsData.value?.financePayload?.employees || {}

  for (const row of employeeRows.value) {
    const rawHistory = (insightsData.value?.historyItems || [])
      .filter(item => getHistoryBarberId(item) === row.id)
      .sort((a, b) => {
        const left = getHistoryTimestamp(a)
        const right = getHistoryTimestamp(b)
        return (right ? new Date(right).getTime() : 0) - (left ? new Date(left).getTime() : 0)
      })
    const history = rawHistory.filter(item => isFinalHistoryStatus(item.status))
    const completedHistory = history.filter(item => isCompletedStatus(item.status))
    const cancelledHistory = history.filter(item => isCancelledStatus(item.status))
    const periodHistory = history.filter((item) => {
      const timestamp = getHistoryTimestamp(item)
      const dateKey = timestamp ? timestamp.slice(0, 10) : null
      return !dateKey || (dateKey >= range.start_date && dateKey <= range.end_date)
    })
    const periodCompletedHistory = periodHistory.filter(item => isCompletedStatus(item.status))
    const revenue = completedHistory.reduce((sum, item) => sum + getHistoryAmount(item, servicePriceMap.value), 0)
    const periodRevenue = periodCompletedHistory.reduce((sum, item) => sum + getHistoryAmount(item, servicePriceMap.value), 0)
    const draft = resolveFinanceDraft(financeEmployees[row.id], row.id, row.branch_id)
    const reportProfit = draft.profit > 0 ? draft.profit : periodRevenue
    const commission = commissionForDraft(draft, periodRevenue)

    map.set(row.id, {
      cancelled: cancelledHistory.length,
      completed: completedHistory.length,
      finance: {
        ...draft,
        commission,
        payout: Math.round(draft.salary + commission - draft.advances - draft.penalty),
        reportProfit
      },
      history,
      periodRevenue,
      revenue,
      visits: history.length
    })
  }

  return map
})
const selectedEmployee = computed(() =>
  employeeRows.value.find(row => row.id === selectedEmployeeId.value) || null
)
const selectedEmployeeInsight = computed(() =>
  selectedEmployeeId.value ? employeeInsightMap.value.get(selectedEmployeeId.value) || null : null
)

const selectedRoleDescription = computed(() => roleDescriptions[form.role])
const selectedPermissionCount = computed(() => form.permissions.length)
const selectedPermissionLabels = computed(() =>
  form.permissions.map(permission => employeePermissionDefinitions[permission]?.label || permission)
)
const avatarPreviewUrl = computed(() => avatarObjectUrl.value || form.photo_url || '')
const selectedPermissionPreview = computed(() => {
  if (!selectedPermissionLabels.value.length) {
    return 'Права не выбраны'
  }

  const preview = selectedPermissionLabels.value.slice(0, 3).join(', ')
  const remaining = selectedPermissionLabels.value.length - 3

  return remaining > 0 ? `${preview} и еще ${remaining}` : preview
})

watch([filteredRows, page], () => {
  if (page.value > pageCount.value) {
    page.value = pageCount.value
  }
})

watch(
  () => [branchStore.activeBranchId, employeeRows.value.length],
  () => {
    page.value = 1
  }
)

watch(
  () => branchStore.activeBranchId,
  (id) => {
    if (!form.branch_id && id) {
      form.branch_id = id
    }
  },
  { immediate: true }
)

watch(
  () => form.role,
  (role) => {
    if (isSyncingRolePreset.value) {
      return
    }

    applyRolePreset(role)
  }
)

watch(formModalOpen, (open) => {
  if (!open) {
    resetForm()
  }
})

function applyRolePreset(role: EmployeeRole) {
  form.permissions = [...employeeRolePermissionPresets[role]]
}

function clearFieldErrors() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
}

function clearAvatarSelection() {
  avatarFile.value = null

  if (avatarObjectUrl.value) {
    globalThis.URL?.revokeObjectURL(avatarObjectUrl.value)
    avatarObjectUrl.value = ''
  }
}

function resetForm(clearEditing = true) {
  if (clearEditing) {
    editingId.value = ''
  }

  clearAvatarSelection()
  isSyncingRolePreset.value = true
  form.login = ''
  form.name = ''
  form.password = ''
  form.photo_url = ''
  form.phone = ''
  form.role = 'barber'
  form.specialization = ''
  form.branch_id = branchStore.activeBranchId || ''
  form.permissions = [...employeeRolePermissionPresets.barber]
  isSyncingRolePreset.value = false
  clearFieldErrors()
}

function hasPermission(permission: EmployeePermission) {
  return form.permissions.includes(permission)
}

function isReadOnlyPermission(permission: EmployeePermission) {
  return permission.includes('.read')
}

function setPermission(permission: EmployeePermission, enabled: boolean) {
  if (enabled) {
    if (!hasPermission(permission)) {
      form.permissions = [...form.permissions, permission]
    }

    return
  }

  form.permissions = form.permissions.filter(item => item !== permission)
}

function openCreateModal() {
  resetForm()
  formModalOpen.value = true
}

async function refreshDirectory() {
  await Promise.allSettled([
    refresh(),
    refreshInsights()
  ])
}

function openEmployeeDetails(row: EmployeeRow) {
  selectedEmployeeId.value = row.id
  detailsModalOpen.value = true
}

function clearAvatar() {
  clearAvatarSelection()
  form.photo_url = ''
}

function startEdit(row: EmployeeRow) {
  clearFieldErrors()
  editingId.value = row.id

  clearAvatarSelection()
  isSyncingRolePreset.value = true
  form.branch_id = row.branch_id || branchStore.activeBranchId || ''
  form.login = row.login
  form.name = row.name
  form.password = ''
  form.photo_url = row.photo_url || ''
  form.phone = row.phone || ''
  form.role = (row.role in employeeRoleLabels ? row.role : 'barber') as EmployeeRole
  form.specialization = row.specialization || ''
  form.permissions = row.permissions.length
    ? [...row.permissions]
    : [...employeeRolePermissionPresets[form.role]]
  isSyncingRolePreset.value = false

  formModalOpen.value = true
}

function applyFieldErrors(issues: Array<{ message?: string, path?: PropertyKey[] }>) {
  clearFieldErrors()

  for (const issue of issues) {
    const path = issue.path?.[0]

    if (typeof path === 'string' && !fieldErrors[path]) {
      fieldErrors[path] = issue.message || 'Некорректное значение'
    }
  }
}

function handleAvatarInput(event: Event) {
  const file = (event.target as HTMLInputElement)?.files?.[0] || null
  avatarFile.value = file
}

function buildEmployeeFormData(payload: {
  branch_id: string
  login: string
  name: string
  password?: string
  permissions: EmployeePermission[]
  photo_url?: string | null
  phone?: string | null
  role: EmployeeRole
  specialization?: string | null
}) {
  const formData = new FormData()

  formData.append('branch_id', payload.branch_id)
  formData.append('login', payload.login)
  formData.append('name', payload.name)
  formData.append('role', payload.role)

  if (payload.password) {
    formData.append('password', payload.password)
  }

  if (payload.photo_url) {
    formData.append('photo_url', payload.photo_url)
  }

  if (payload.phone) {
    formData.append('phone', payload.phone)
  }

  if (payload.specialization) {
    formData.append('specialization', payload.specialization)
  }

  payload.permissions.forEach(permission => formData.append('permissions', permission))

  if (avatarFile.value) {
    formData.append('file', avatarFile.value)
  }

  return formData
}

async function submitEmployee() {
  if (submitting.value) {
    return
  }

  try {
    submitting.value = true

    if (isEditing.value && editingId.value) {
      const parsed = barberUpdateSchema.safeParse({
        branch_id: form.branch_id || branchStore.activeBranchId,
        login: form.login,
        name: form.name,
        password: form.password || undefined,
        permissions: [...form.permissions],
        photo_url: form.photo_url || undefined,
        phone: form.phone || undefined,
        role: form.role,
        specialization: form.specialization || undefined
      })

      if (!parsed.success) {
        applyFieldErrors(parsed.error.issues)
        apiClient.notifyError(new Error(parsed.error.issues[0]?.message || 'Проверьте данные формы'))
        return
      }

      const body = avatarFile.value ? buildEmployeeFormData(parsed.data) : parsed.data
      await barbersApi.update(editingId.value, body)
    }
    else {
      const parsed = barberRegisterSchema.safeParse({
        branch_id: form.branch_id || branchStore.activeBranchId,
        login: form.login,
        name: form.name,
        password: form.password,
        permissions: [...form.permissions],
        photo_url: form.photo_url || undefined,
        phone: form.phone || undefined,
        role: form.role,
        specialization: form.specialization || undefined
      })

      if (!parsed.success) {
        applyFieldErrors(parsed.error.issues)
        apiClient.notifyError(new Error(parsed.error.issues[0]?.message || 'Проверьте данные формы'))
        return
      }

      const body = avatarFile.value ? buildEmployeeFormData(parsed.data) : parsed.data
      await barbersApi.register(body)
    }

    await refreshDirectory()
    formModalOpen.value = false
  }
  finally {
    submitting.value = false
  }
}

async function removeEmployee(row: EmployeeRow) {
  const label = row.name || row.login

  if (import.meta.client && !window.confirm(`Удалить сотрудника ${label}?`)) {
    return
  }

  removingId.value = row.id

  try {
    await barbersApi.remove(row.id)
    await refreshDirectory()

    if (editingId.value === row.id) {
      formModalOpen.value = false
    }
  }
  finally {
    removingId.value = ''
  }
}

watch(avatarFile, (file) => {
  if (avatarObjectUrl.value) {
    globalThis.URL?.revokeObjectURL(avatarObjectUrl.value)
    avatarObjectUrl.value = ''
  }

  if (file) {
    const objectUrl = globalThis.URL?.createObjectURL(file)

    if (objectUrl) {
      avatarObjectUrl.value = objectUrl
    }
  }
})

onBeforeUnmount(() => {
  if (avatarObjectUrl.value) {
    globalThis.URL?.revokeObjectURL(avatarObjectUrl.value)
  }
})
</script>

<template>
  <UDashboardPanel id="employees">
    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-2">
            <UBadge color="neutral" size="lg" variant="soft">
              {{ filteredRows.length }} сотрудников
            </UBadge>
            <div class="flex items-center gap-2">
              <UButton color="primary" icon="i-lucide-user-plus" @click="openCreateModal">
                Добавить сотрудника
              </UButton>
              <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending || insightsPending" variant="outline" @click="refreshDirectory()">
                Обновить список
              </UButton>
            </div>
          </div>

          <div class="grid gap-3 pb-4 md:grid-cols-3">
            <UInput
              v-model="searchLogin"
              icon="i-lucide-search"
              placeholder="Поиск по логину"
            />
            <USelectMenu
              v-model="roleFilter"
              :items="roleFilterOptions"
              value-key="value"
              placeholder="Все роли"
            />
          </div>

          <div v-if="filteredRows.length" class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <div class="max-h-[80vh] overflow-auto">
              <UTable
                :columns="columns"
                :data="pagedRows"
                :loading="pending"
                sticky="header"
                :ui="{
                  root: 'w-full overflow-auto',
                  base: 'w-full min-w-[84rem]',
                  thead: 'bg-charcoal-50/90',
                  tbody: 'divide-y divide-charcoal-100',
                  th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
                  td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
                }"
              >
                <template #login-cell="{ row }">
                  <span class="font-semibold text-charcoal-950">{{ row.original.login }}</span>
                </template>

                <template #name-cell="{ row }">
                  <button
                    class="flex w-full items-center gap-3 text-left"
                    type="button"
                    @click="openEmployeeDetails(row.original)"
                  >
                    <div class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-charcoal-200 bg-charcoal-100">
                      <img
                        v-if="row.original.photo_url"
                        :alt="row.original.name"
                        :src="`${config.public.apiBase}${row.original.photo_url}`"
                        class="size-full object-cover"
                      >
                      <UIcon v-else class="text-lg text-charcoal-400" name="i-lucide-user-round" />
                    </div>
                    <div class="space-y-1">
                      <span class="block font-medium text-charcoal-900">{{ row.original.name }}</span>
                      <span v-if="row.original.specialization" class="text-xs text-charcoal-500">
                        {{ row.original.specialization }}
                      </span>
                    </div>
                  </button>
                </template>

                <template #phone-cell="{ row }">
                  <span class="text-sm text-charcoal-700">{{ row.original.phone || 'Не указан' }}</span>
                </template>

                <template #branch-cell="{ row }">
                  <span class="text-sm text-charcoal-700">{{ row.original.branch }}</span>
                </template>

                <template #role-cell="{ row }">
                  <UBadge color="primary" variant="soft">
                    {{ getEmployeeRoleLabel(row.original.role) }}
                  </UBadge>
                </template>

                <template #permissions-cell="{ row }">
                  <div class="space-y-1">
                    <span class="block font-medium text-charcoal-900">
                      {{ row.original.permissions.length }} прав
                    </span>
                    <span class="text-xs text-charcoal-500">
                      {{ row.original.permissions.length
                        ? row.original.permissions.slice(0, 2).map(permission => employeePermissionDefinitions[permission]?.label || permission).join(', ')
                        : 'Права не настроены' }}
                    </span>
                  </div>
                </template>

                <template #actions-cell="{ row }">
                  <div class="flex justify-end gap-2">
                    <UTooltip text="Статистика">
                      <UButton
                        aria-label="Открыть статистику сотрудника"
                        color="neutral"
                        icon="i-lucide-chart-no-axes-combined"
                        square
                        variant="ghost"
                        @click="openEmployeeDetails(row.original)"
                      />
                    </UTooltip>

                    <UTooltip text="Редактировать">
                      <UButton
                        aria-label="Редактировать сотрудника"
                        color="neutral"
                        icon="i-lucide-pencil"
                        square
                        variant="ghost"
                        @click="startEdit(row.original)"
                      />
                    </UTooltip>

                    <UTooltip text="Удалить">
                      <UButton
                        aria-label="Удалить сотрудника"
                        color="error"
                        icon="i-lucide-trash-2"
                        :loading="removingId === row.original.id"
                        square
                        variant="ghost"
                        @click="removeEmployee(row.original)"
                      />
                    </UTooltip>
                  </div>
                </template>
              </UTable>
            </div>
            <div class="flex items-center justify-end gap-3 border-t border-charcoal-100 px-4 py-3">
              <span class="text-xs text-charcoal-500">
                Показано {{ pagedRows.length ? (page - 1) * pageSize + 1 : 0 }}–{{ Math.min(page * pageSize, filteredRows.length) }} из {{ filteredRows.length }}
              </span>
              <UPagination
                v-model="page"
                :page-count="pageCount"
                :total="filteredRows.length"
                :per-page="pageSize"
                size="sm"
              />
            </div>
          </div>
          <SharedEmptyState
            v-else
            description="Список сотрудников пуст. Добавьте первого сотрудника через модальное окно."
            icon="i-lucide-users"
            title="Нет сотрудников"
          />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal
    v-model:open="detailsModalOpen"
    class="sm:max-w-[760px]"
    :title="selectedEmployee?.name || 'Сотрудник'"
    :description="selectedEmployee ? `${selectedEmployee.branch} · ${getEmployeeRoleLabel(selectedEmployee.role)}` : undefined"
  >
    <template #body>
      <div v-if="selectedEmployee" class="space-y-5">
        <div class="flex flex-col gap-4 rounded-[1.5rem] border border-charcoal-200 bg-white/90 p-4 sm:flex-row sm:items-center">
          <div class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-charcoal-200 bg-charcoal-100">
            <img
              v-if="selectedEmployee.photo_url"
              :alt="selectedEmployee.name"
              :src="selectedEmployee.photo_url"
              class="size-full object-cover"
            >
            <UIcon v-else class="text-2xl text-charcoal-400" name="i-lucide-user-round" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-lg font-semibold text-charcoal-950">{{ selectedEmployee.name }}</p>
            <p class="text-sm text-charcoal-600">{{ selectedEmployee.login }} · {{ selectedEmployee.phone || 'Телефон не указан' }}</p>
            <p v-if="selectedEmployee.specialization" class="text-sm text-charcoal-500">{{ selectedEmployee.specialization }}</p>
          </div>
          <UBadge color="primary" variant="soft">
            {{ getEmployeeRoleLabel(selectedEmployee.role) }}
          </UBadge>
        </div>

        <div class="grid gap-3 sm:grid-cols-4">
          <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
            <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Визиты</p>
            <p class="mt-2 text-lg font-semibold text-charcoal-950">{{ formatCount(selectedEmployeeInsight?.visits || 0) }}</p>
          </div>
          <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
            <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Завершено</p>
            <p class="mt-2 text-lg font-semibold text-emerald-600">{{ formatCount(selectedEmployeeInsight?.completed || 0) }}</p>
          </div>
          <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
            <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Отмены</p>
            <p class="mt-2 text-lg font-semibold text-amber-600">{{ formatCount(selectedEmployeeInsight?.cancelled || 0) }}</p>
          </div>
          <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
            <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Выручка</p>
            <p class="mt-2 text-lg font-semibold text-charcoal-950">{{ formatMoney(selectedEmployeeInsight?.revenue || 0) }}</p>
          </div>
        </div>

        <div class="rounded-[1.5rem] border border-charcoal-200 bg-white/90 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Финансы</p>
              <p class="mt-1 text-sm text-charcoal-600">Период {{ currentPeriodKey() }}</p>
            </div>
            <UBadge color="neutral" variant="outline">
              {{ formatMoney(selectedEmployeeInsight?.finance.reportProfit || 0) }}
            </UBadge>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl bg-charcoal-50/70 px-3 py-2">
              <p class="text-xs uppercase tracking-[0.14em] text-charcoal-500">Цель</p>
              <p class="mt-1 font-semibold text-charcoal-950">{{ formatMoney(selectedEmployeeInsight?.finance.salary || 0) }}</p>
            </div>
            <div class="rounded-xl bg-charcoal-50/70 px-3 py-2">
              <p class="text-xs uppercase tracking-[0.14em] text-charcoal-500">Комиссия</p>
              <p class="mt-1 font-semibold text-charcoal-950">{{ formatMoney(selectedEmployeeInsight?.finance.commission || 0) }}</p>
            </div>
            <div class="rounded-xl bg-charcoal-50/70 px-3 py-2">
              <p class="text-xs uppercase tracking-[0.14em] text-charcoal-500">К выплате</p>
              <p class="mt-1 font-semibold text-charcoal-950">{{ formatMoney(selectedEmployeeInsight?.finance.payout || 0) }}</p>
            </div>
            <div class="rounded-xl bg-charcoal-50/70 px-3 py-2">
              <p class="text-xs uppercase tracking-[0.14em] text-charcoal-500">Аванс</p>
              <p class="mt-1 font-semibold text-charcoal-950">{{ formatMoney(selectedEmployeeInsight?.finance.advances || 0) }}</p>
            </div>
            <div class="rounded-xl bg-charcoal-50/70 px-3 py-2">
              <p class="text-xs uppercase tracking-[0.14em] text-charcoal-500">Штраф</p>
              <p class="mt-1 font-semibold text-charcoal-950">{{ formatMoney(selectedEmployeeInsight?.finance.penalty || 0) }}</p>
            </div>
            <div class="rounded-xl bg-charcoal-50/70 px-3 py-2">
              <p class="text-xs uppercase tracking-[0.14em] text-charcoal-500">Процент</p>
              <p class="mt-1 font-semibold text-charcoal-950">{{ selectedEmployeeInsight?.finance.profit_percent || 0 }}%</p>
            </div>
          </div>
        </div>

        <div class="rounded-[1.5rem] border border-charcoal-200 bg-white/90 p-4">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">История</p>
            <UBadge color="neutral" variant="outline">
              {{ formatCount(selectedEmployeeInsight?.history.length || 0) }}
            </UBadge>
          </div>

          <div v-if="selectedEmployeeInsight?.history.length" class="mt-4 max-h-[18rem] space-y-2 overflow-auto pr-1">
            <div
              v-for="item in selectedEmployeeInsight.history.slice(0, 8)"
              :key="item.id"
              class="rounded-xl border border-charcoal-200 bg-charcoal-50/50 px-3 py-2"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-charcoal-950">
                    {{ item.client?.name || item.customer_name || 'Клиент' }}
                  </p>
                  <p class="text-xs text-charcoal-500">
                    {{ formatDateTime(getHistoryTimestamp(item) || '') }}
                  </p>
                </div>
                <div class="text-right">
                  <SharedStatusBadge :label="item.status" />
                  <p class="mt-1 text-xs font-semibold text-charcoal-700">
                    {{ formatMoney(getHistoryAmount(item, servicePriceMap)) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <SharedEmptyState
            v-else
            description="По выбранному филиалу история этого сотрудника не найдена."
            icon="i-lucide-history"
            title="История пуста"
          />
        </div>
      </div>
    </template>
  </UModal>

  <UModal v-model:open="formModalOpen" class="sm:max-w-[650px]" :title="modalTitle" :description="modalDescription">
    <template #body>
      <form class="flex flex-col gap-6" @submit.prevent="submitEmployee">
        <div class="space-y-6">
          <div class="rounded-[1.5rem] border border-charcoal-200 bg-charcoal-50/50 p-5">
            <div class="space-y-1 pb-4">
              <h3 class="barbershop-heading text-xl text-charcoal-950">
                Основные данные
              </h3>
              <p class="text-sm text-charcoal-500">
                Базовая учетная запись и профиль сотрудника.
              </p>
            </div>

            <div class="flex flex-col gap-4">
              <div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4">
                <div class="flex flex-col gap-4 md:flex-row md:items-center">
                  <div class="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-charcoal-200 bg-charcoal-100">
                    <img
                      v-if="avatarPreviewUrl"
                      :alt="form.name || form.login || 'Аватар сотрудника'"
                      :src="avatarPreviewUrl"
                      class="size-full object-cover"
                    >
                    <UIcon v-else class="text-3xl text-charcoal-400" name="i-lucide-image-plus" />
                  </div>

                  <div class="flex min-w-0 flex-1 flex-col gap-3">
                    <div>
                      <p class="text-sm font-semibold text-charcoal-900">
                        Аватар сотрудника
                      </p>
                      <p class="text-xs text-charcoal-500">
                        После сохранения изображение будет опубликовано и появится в таблице сотрудников.
                      </p>
                    </div>

                    <UInput
                      accept="image/*"
                      class="w-full"
                      type="file"
                      @change="handleAvatarInput"
                    />

                    <div class="flex flex-wrap items-center gap-3">
                      <span class="text-xs text-charcoal-500">
                        PNG, JPG, WEBP или GIF до 5 МБ
                      </span>
                      <UButton
                        v-if="form.photo_url || avatarFile"
                        color="neutral"
                        icon="i-lucide-trash-2"
                        size="sm"
                        type="button"
                        variant="outline"
                        @click="clearAvatar"
                      >
                        Убрать аватар
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>
              <UFormField label="Филиал" name="branch_id" :error="fieldErrors.branch_id">
                <USelectMenu
                  v-model="form.branch_id"
                  class="w-full"
                  :items="branchOptions"
                  placeholder="Выберите филиал"
                  value-key="value"
                />
              </UFormField>

              <UFormField label="Роль" name="role" :error="fieldErrors.role">
                <USelectMenu
                  v-model="form.role"
                  class="w-full"
                  :items="roleOptions"
                  placeholder="Выберите роль"
                  value-key="value"
                />
              </UFormField>

              <UFormField label="Логин" name="login" :error="fieldErrors.login">
                <UInput v-model="form.login" class="w-full" placeholder="employee01" />
              </UFormField>

              <UFormField label="Пароль" name="password" :error="fieldErrors.password">
                <UInput v-model="form.password" class="w-full" :placeholder="passwordPlaceholder" type="password" />
              </UFormField>

              <UFormField label="Имя" name="name" :error="fieldErrors.name">
                <UInput v-model="form.name" placeholder="Иван Сотрудник" />
              </UFormField>

              <UFormField label="Телефон" name="phone" :error="fieldErrors.phone">
                <UInput v-model="form.phone" class="w-full" placeholder="+998 90 000 00 00" />
              </UFormField>

              <UFormField class="lg:col-span-2" label="Специализация" name="specialization" :error="fieldErrors.specialization">
                <UInput v-model="form.specialization" placeholder="Мужские стрижки / администратор филиала / старший мастер" />
              </UFormField>
            </div>
          </div>

          <div class="rounded-[1.5rem] border border-charcoal-200 bg-white p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-1">
                <h3 class="barbershop-heading text-xl text-charcoal-950">
                  Доступ сотрудника
                </h3>
                <p class="text-sm text-charcoal-500">
                  Роль задает стартовый preset, после чего админ может донастроить права свитчами.
                </p>
              </div>
              <UButton color="neutral" icon="i-lucide-wand-sparkles" size="sm" type="button" variant="outline" @click="applyRolePreset(form.role)">
                Сбросить по роли
              </UButton>
            </div>

            <div class="mt-4 rounded-[1.25rem] border border-primary-200 bg-primary-50/60 p-4">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge color="primary" variant="soft">
                  {{ employeeRoleLabels[form.role] }}
                </UBadge>
                <span class="text-sm font-medium text-charcoal-900">{{ selectedPermissionCount }} прав выбрано</span>
              </div>
              <p class="mt-2 text-sm text-charcoal-600">
                {{ selectedRoleDescription }}
              </p>
              <p class="mt-3 text-xs text-charcoal-500">
                {{ selectedPermissionPreview }}
              </p>
            </div>

            <div class="mt-4 flex flex-col gap-4">
              <div
                v-for="section in employeePermissionSections"
                :key="section.key"
                class="rounded-[1.25rem] border border-charcoal-200 bg-charcoal-50/40 p-4"
              >
                <div class="pb-3">
                  <h4 class="text-sm font-semibold uppercase tracking-[0.16em] text-charcoal-500">
                    {{ section.label }}
                  </h4>
                </div>

                <div class="flex flex-col gap-3">
                  <USwitch
                    v-for="permission in section.items"
                    :key="permission"
                    :description="employeePermissionDefinitions[permission].description"
                    :label="employeePermissionDefinitions[permission].label"
                    :model-value="hasPermission(permission)"
                    @update:model-value="(value) => setPermission(permission, Boolean(value))"
                  >
                    <template #label="{ label }">
                      <span class="inline-flex items-center gap-2">
                        <UTooltip v-if="isReadOnlyPermission(permission)" text="Только чтение">
                          <UIcon class="text-base text-charcoal-400" name="i-lucide-eye" />
                        </UTooltip>
                        <span>{{ label }}</span>
                      </span>
                    </template>
                  </USwitch>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="rounded-[1.5rem] border border-charcoal-200 bg-charcoal-950 p-5 text-white">
            <div class="space-y-1">
              <h3 class="barbershop-heading text-xl text-white">
                Предпросмотр доступа
              </h3>
              <p class="text-sm text-white/70">
                Быстрый обзор того, что получит сотрудник после сохранения.
              </p>
            </div>

            <div class="mt-4 space-y-3">
              <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-white/50">
                  Роль
                </p>
                <p class="mt-2 text-base font-semibold">
                  {{ employeeRoleLabels[form.role] }}
                </p>
              </div>

              <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-white/50">
                  Филиал
                </p>
                <p class="mt-2 text-base font-semibold">
                  {{ branchMap.get(form.branch_id) || 'Не выбран' }}
                </p>
              </div>

              <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-white/50">
                  Набор прав
                </p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <UBadge
                    v-for="permission in form.permissions"
                    :key="permission"
                    color="neutral"
                    variant="soft"
                  >
                    {{ employeePermissionDefinitions[permission].label }}
                  </UBadge>
                  <span v-if="!form.permissions.length" class="text-sm text-white/60">
                    Права не выбраны
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-3">
            <UButton color="primary" :icon="submitIcon" type="submit" :loading="submitting">
              {{ submitLabel }}
            </UButton>
            <UButton color="neutral" variant="ghost" type="button" :disabled="submitting" @click="resetForm(!isEditing)">
              Очистить форму
            </UButton>
          </div>
        </div>
      </form>
    </template>
  </UModal>
</template>
