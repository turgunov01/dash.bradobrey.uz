<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { barberRegisterSchema } from '~~/shared/schemas'

const branchStore = useBranchStore()
const barbersApi = useBarbersApi()

await branchStore.ensureLoaded()

const createModalOpen = ref(false)
const submitting = ref(false)

const form = reactive({
  branch_id: branchStore.activeBranchId || '',
  login: '',
  name: '',
  password: '',
  phone: '',
  specialization: ''
})

const fieldErrors = reactive<Record<string, string>>({})

const branchOptions = computed(() =>
  branchStore.branches.map(branch => ({
    label: branch.name,
    value: branch.id
  }))
)

const branchMap = computed(() =>
  new Map(branchStore.branches.map(branch => [branch.id, branch.name]))
)

const columns: TableColumn<any>[] = [
  { accessorKey: 'login', header: 'Логин' },
  { accessorKey: 'name', header: 'Имя' },
  { accessorKey: 'phone', header: 'Телефон' },
  { accessorKey: 'branch', header: 'Филиал' },
  { accessorKey: 'role', header: 'Роль' }
]

const page = ref(1)
const pageSize = 10

const { data, pending, refresh } = await useAsyncData('barbers-directory', async () => {
  const response = await barbersApi.list()
  const items = Array.isArray(response?.items) ? response.items : []

  return { items }
}, {
  watch: [() => branchStore.activeBranchId]
})

const barberRows = computed(() => {
  const items = data.value?.items || []

  return items.map((item, index) => ({
    branch: branchMap.value.get(item.branch_id || '') || 'Не указан',
    branch_id: item.branch_id || '',
    login: item.login || 'Без логина',
    name: item.login || 'Барбер без имени',
    phone: '',
    role: item.role || 'barber'
  }))
})

const pageCount = computed(() => Math.max(1, Math.ceil(barberRows.value.length / pageSize)))
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return barberRows.value.slice(start, start + pageSize)
})

watch([barberRows, page], () => {
  if (page.value > pageCount.value) {
    page.value = pageCount.value
  }
})

watch(
  () => branchStore.activeBranchId,
  (id) => {
    if (!form.branch_id && id) {
      form.branch_id = id
    }
  },
  { immediate: true }
)

function resetForm() {
  form.login = ''
  form.name = ''
  form.password = ''
  form.phone = ''
  form.specialization = ''
  form.branch_id = branchStore.activeBranchId || ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
}

watch(createModalOpen, (open) => {
  if (!open) {
    resetForm()
  }
})

function applyFieldErrors(issues: any[]) {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])

  for (const issue of issues) {
    const path = issue.path?.[0]
    if (typeof path === 'string' && !fieldErrors[path]) {
      fieldErrors[path] = issue.message || 'Некорректное значение'
    }
  }
}

async function createBarber() {
  if (submitting.value) {
    return
  }

  const parsed = barberRegisterSchema.safeParse({
    branch_id: form.branch_id || branchStore.activeBranchId,
    login: form.login,
    name: form.name,
    password: form.password,
    phone: form.phone || undefined,
    specialization: form.specialization || undefined
  })

  if (!parsed.success) {
    applyFieldErrors(parsed.error.issues)
    useApiClient().notifyError(new Error(parsed.error.issues[0]?.message || 'Проверьте данные формы'))
    return
  }

  try {
    submitting.value = true
    await barbersApi.register(parsed.data)
    await refresh()
    createModalOpen.value = false
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="barbers">
    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-2">
            <UBadge color="neutral" size="lg" variant="soft">
              {{ barberRows.length }} барберов
            </UBadge>
            <div class="flex items-center gap-2">
              <UButton color="primary" icon="i-lucide-plus" @click="createModalOpen = true">
                Создать барбера
              </UButton>
              <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
                Обновить список
              </UButton>
            </div>
          </div>

          <div v-if="barberRows.length" class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <div class="max-h-[80vh] overflow-auto">
              <UTable
                :columns="columns"
                :data="pagedRows"
                :loading="pending"
                sticky="header"
                :ui="{
                  root: 'w-full overflow-auto',
                  base: 'w-full min-w-[64rem]',
                  thead: 'bg-charcoal-50/90',
                  tbody: 'divide-y divide-charcoal-100',
                  th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
                  td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
                }"
              >
                <template #login-cell="{ row }">
                  <span class="font-semibold text-charcoal-950">{{ row.original.login }}</span>
                </template>
                <template #branch-cell="{ row }">
                  <span class="text-sm text-charcoal-700">{{ row.original.branch }}</span>
                </template>
              </UTable>
            </div>
            <div class="flex items-center justify-end gap-3 border-t border-charcoal-100 px-4 py-3">
              <span class="text-xs text-charcoal-500">
                Показано {{ pagedRows.length ? (page - 1) * pageSize + 1 : 0 }}–{{ Math.min(page * pageSize, barberRows.length) }} из {{ barberRows.length }}
              </span>
              <UPagination
                v-model="page"
                :page-count="pageCount"
                :total="barberRows.length"
                :per-page="pageSize"
                size="sm"
              />
            </div>
          </div>
          <SharedEmptyState
            v-else
            description="Список барберов пуст. Создайте первого барбера."
            icon="i-lucide-users"
            title="Нет барберов"
          />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="createModalOpen" class="sm:max-w-3xl" title="Создать барбера" description="Заполните форму, чтобы добавить нового барбера.">
    <template #body>
      <form class="grid gap-4 lg:grid-cols-2" @submit.prevent="createBarber">
        <UFormField label="Филиал" name="branch_id" :error="fieldErrors.branch_id">
          <USelectMenu
            v-model="form.branch_id"
            :items="branchOptions"
            placeholder="Выберите филиал"
            value-key="value"
          />
        </UFormField>

        <UFormField label="Логин" name="login" :error="fieldErrors.login">
          <UInput v-model="form.login" placeholder="barber01" />
        </UFormField>

        <UFormField label="Пароль" name="password" :error="fieldErrors.password">
          <UInput v-model="form.password" placeholder="минимум 6 символов" type="password" />
        </UFormField>

        <UFormField label="Имя" name="name" :error="fieldErrors.name">
          <UInput v-model="form.name" placeholder="Иван Барбер" />
        </UFormField>

        <UFormField label="Телефон" name="phone" :error="fieldErrors.phone">
          <UInput v-model="form.phone" placeholder="+998 90 000 00 00" />
        </UFormField>

        <UFormField label="Специализация" name="specialization" :error="fieldErrors.specialization">
          <UInput v-model="form.specialization" placeholder="Мужские стрижки" />
        </UFormField>

        <div class="lg:col-span-2 flex flex-wrap items-center gap-3">
          <UButton color="primary" icon="i-lucide-plus" type="submit" :loading="submitting">
            Создать барбера
          </UButton>
          <UButton color="neutral" variant="ghost" type="button" @click="resetForm" :disabled="submitting">
            Очистить форму
          </UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
