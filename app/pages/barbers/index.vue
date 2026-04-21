<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

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

const roleDescriptions: Record<EmployeeRole, string> = {
  admin: 'Полный контроль над настройками, сотрудниками и внутренними разделами.',
  barber: 'Рабочее место мастера, своя очередь, своя история и личная статистика.',
  manager: 'Операционное управление филиалом, услугами, клиентами и аналитикой филиала.',
  'super-barber': 'Расширенный мастер с доступом к очереди филиала и более широким операциям.',
  'super-manager': 'Старший менеджер с расширенными правами на сотрудников и маркетинговые разделы.'
}

const branchStore = useBranchStore()
const barbersApi = useBarbersApi()

await branchStore.ensureLoaded()

const formModalOpen = ref(false)
const isSyncingRolePreset = ref(false)
const submitting = ref(false)
const removingId = ref('')
const editingId = ref('')
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
        useApiClient().notifyError(new Error(parsed.error.issues[0]?.message || 'Проверьте данные формы'))
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
        useApiClient().notifyError(new Error(parsed.error.issues[0]?.message || 'Проверьте данные формы'))
        return
      }

      const body = avatarFile.value ? buildEmployeeFormData(parsed.data) : parsed.data
      await barbersApi.register(body)
    }

    await refresh()
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
    await refresh()

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
              <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
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
                  <div class="flex items-center gap-3">
                    <div class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-charcoal-200 bg-charcoal-100">
                      <img
                        v-if="row.original.photo_url"
                        :alt="row.original.name"
                        :src="row.original.photo_url"
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
                  </div>
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
                Показано {{ pagedRows.length ? (page - 1) * pageSize + 1 : 0 }}–{{ Math.min(page * pageSize, employeeRows.length) }} из {{ employeeRows.length }}
              </span>
              <UPagination
                v-model="page"
                :page-count="pageCount"
                :total="employeeRows.length"
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
