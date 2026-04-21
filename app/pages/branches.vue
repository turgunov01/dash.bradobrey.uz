<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { Branch } from '~~/shared/schemas'
import { branchFormSchema, branchSchema } from '~~/shared/schemas'

type BranchRow = {
  id: string
  name: string
  address: string | null
  city: string | null
  timezone: string | null
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()

  return text || null
}

function toBranchRow(value: unknown): BranchRow | null {
  const parsed = branchSchema.safeParse(value)

  if (!parsed.success) {
    return null
  }

  const branch = parsed.data as Branch

  return {
    id: String(branch.id),
    name: normalizeText(branch.name) || 'Филиал',
    address: normalizeText((branch as any).address),
    city: normalizeText((branch as any).city),
    timezone: normalizeText((branch as any).timezone),
    is_active: (branch as any).is_active == null ? null : Boolean((branch as any).is_active)
  }
}

function extractBranchItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    items?: unknown[]
    branches?: unknown[]
    data?: unknown[] | { items?: unknown[], branches?: unknown[] }
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.branches)) {
    return payload.branches
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload.data && typeof payload.data === 'object') {
    if (Array.isArray(payload.data.items)) {
      return payload.data.items
    }

    if (Array.isArray(payload.data.branches)) {
      return payload.data.branches
    }
  }

  return []
}

const branchesApi = useBranchesApi()
const branchStore = useBranchStore()

const search = ref('')
const modalOpen = ref(false)
const submitting = ref(false)
const removingId = ref('')

const form = reactive({
  id: '',
  name: '',
  address: '',
  city: '',
  timezone: '',
  is_active: true
})

const columns: TableColumn<BranchRow>[] = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'city', header: 'Город' },
  { accessorKey: 'address', header: 'Адрес' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

const { data, pending, refresh } = await useAsyncData('branches-dashboard', async () => {
  return await branchesApi.list()
})

const branchRows = computed<BranchRow[]>(() =>
  extractBranchItems(data.value).flatMap(item => {
    const row = toBranchRow(item)
    return row ? [row] : []
  })
)

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) {
    return branchRows.value
  }

  return branchRows.value.filter((row) => {
    const haystack = [
      row.name,
      row.address || '',
      row.city || '',
      row.timezone || '',
      row.id
    ].join(' ').toLowerCase()

    return haystack.includes(query)
  })
})

const modalTitle = computed(() => form.id ? 'Редактировать филиал' : 'Создать филиал')
const modalDescription = computed(() => form.id ? 'Обновите параметры филиала и сохраните изменения.' : 'Заполните данные, чтобы добавить новый филиал.')

function resetForm() {
  form.id = ''
  form.name = ''
  form.address = ''
  form.city = ''
  form.timezone = ''
  form.is_active = true
}

function openCreateModal() {
  resetForm()
  modalOpen.value = true
}

function openEditModal(row: BranchRow) {
  form.id = row.id
  form.name = row.name
  form.address = row.address || ''
  form.city = row.city || ''
  form.timezone = row.timezone || ''
  form.is_active = row.is_active !== false
  modalOpen.value = true
}

async function submit() {
  const parsed = branchFormSchema.safeParse({
    name: form.name,
    address: form.address || undefined,
    city: form.city || undefined,
    timezone: form.timezone || undefined,
    is_active: form.is_active
  })

  if (!parsed.success) {
    useApiClient().notifyError(new Error(parsed.error.issues[0]?.message || 'Проверьте данные'))
    return
  }

  submitting.value = true

  try {
    if (form.id) {
      await branchesApi.update(form.id, parsed.data)
    }
    else {
      await branchesApi.create(parsed.data)
    }

    await refresh()
    await branchStore.reload()
    modalOpen.value = false
  }
  finally {
    submitting.value = false
  }
}

async function removeBranch(row: BranchRow) {
  const label = row.name ? `«${row.name}»` : row.id

  if (import.meta.client && !window.confirm(`Удалить филиал ${label}?`)) {
    return
  }

  removingId.value = row.id

  try {
    let deleted = false

    try {
      await branchesApi.remove(row.id, { silent: true })
      deleted = true
    }
    catch (error: any) {
      const payload = error?.data || error?.response?._data || null
      const code = payload?.data?.code || payload?.code || null

      if (code === 'BRANCH_DELETE_HAS_QUEUE_ENTRIES') {
        if (import.meta.client && window.confirm(`В филиале ${label} есть записи очереди. Удалить филиал вместе с ними?`)) {
          await branchesApi.remove(row.id, { force: true })
          deleted = true
        }

        if (!deleted) {
          return
        }
      }
      else if (code === 'BRANCH_DELETE_HAS_USERS') {
        if (import.meta.client && window.confirm(`В филиале ${label} есть сотрудники. Удалить филиал и отвязать сотрудников от филиала?`)) {
          await branchesApi.remove(row.id, { force: true })
          deleted = true
        }

        if (!deleted) {
          return
        }
      }
      else if (code === 'BRANCH_DELETE_HAS_BARBERS') {
        if (import.meta.client && window.confirm(`В филиале ${label} есть мастера. Удалить филиал и отвязать мастеров от филиала?`)) {
          await branchesApi.remove(row.id, { force: true })
          deleted = true
        }

        if (!deleted) {
          return
        }
      }
      else {
        useApiClient().notifyError(error)
        throw error
      }
    }

    if (!deleted) {
      return
    }

    await refresh()
    await branchStore.reload()
  }
  finally {
    removingId.value = ''
  }
}
</script>

<template>
  <UDashboardPanel id="branches">
    <template #header>
      <UDashboardNavbar title="Филиалы" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" @click="openCreateModal">
            Создать
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <template #header>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Справочник
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  Управление филиалами
                </h2>
              </div>

              <div class="flex flex-wrap items-center justify-end gap-3">
                <UInput v-model="search" placeholder="Поиск по названию, адресу или id" class="w-full sm:w-72" />

                <UBadge color="neutral" size="lg" variant="soft">
                  {{ filteredRows.length }} филиалов
                </UBadge>
              </div>
            </div>
          </template>

          <div
            v-if="filteredRows.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="columns" :data="filteredRows">
              <template #name-cell="{ row }">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium text-charcoal-950">{{ row.original.name }}</span>
                  <UBadge v-if="row.original.id === branchStore.activeBranchId" color="primary" size="xs" variant="soft">
                    Текущий
                  </UBadge>
                </div>
                <p class="mt-1 text-xs text-charcoal-500">
                  {{ row.original.id }}
                </p>
              </template>

              <template #city-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.city || '—' }}
                </span>
              </template>

              <template #address-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.address || '—' }}
                </span>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  :color="row.original.is_active === false ? 'neutral' : 'success'"
                  variant="soft"
                >
                  {{ row.original.is_active === false ? 'Неактивен' : 'Активен' }}
                </UBadge>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEditModal(row.original)" />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :loading="removingId === row.original.id"
                    @click="removeBranch(row.original)"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <SharedEmptyState
            v-else-if="!pending"
            description="Филиалы не найдены или не удалось получить список."
            icon="i-lucide-store"
            title="Пусто"
          />

          <div v-else class="flex justify-center py-8">
            <ULoader size="lg" />
          </div>
        </UCard>
      </div>

      <UModal
        v-model:open="modalOpen"
        class="sm:max-w-xl"
        :description="modalDescription"
        :title="modalTitle"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название">
              <UInput v-model="form.name" />
            </UFormField>

            <UFormField label="Адрес">
              <UInput v-model="form.address" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Город">
                <UInput v-model="form.city" />
              </UFormField>

              <UFormField label="Timezone">
                <UInput v-model="form.timezone" placeholder="Asia/Tashkent" />
              </UFormField>
            </div>

            <UCheckbox v-model="form.is_active" label="Филиал активен" />
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex w-full flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="outline" :disabled="submitting" @click="resetForm">
              Сбросить
            </UButton>
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="close">
              Закрыть
            </UButton>
            <UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submit">
              {{ form.id ? 'Сохранить' : 'Создать' }}
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
