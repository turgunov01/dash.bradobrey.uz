<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { ServiceCategory, ServiceCategoryFormPayload } from '~~/shared/schemas'

const apiClient = useApiClient()

type CategoryRow = {
  id: string
  name: string
  sort_order: string | number | null
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function toIntegerOrNull(value: unknown) {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null

  const text = String(value).trim()
  if (!text) return null

  const num = Number.parseInt(text, 10)
  return Number.isFinite(num) ? num : null
}

function toRow(value: ServiceCategory): CategoryRow | null {
  const id = normalizeText(value?.id)
  if (!id) return null

  return {
    id,
    is_active: value.is_active ?? null,
    name: normalizeText(value.name || value.title) || 'Категория',
    sort_order: value.sort_order ?? null
  }
}

const branchStore = useBranchStore()
const categoriesApi = useServiceCategoriesApi()

await branchStore.ensureLoaded()

const createOpen = ref(false)
const editOpen = ref(false)
const submitting = ref(false)
const cloning = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  is_active: true,
  name: '',
  sort_order: ''
})

function resetForm() {
  form.name = ''
  form.sort_order = String(nextSortOrder.value)
  form.is_active = true
}

function openCreate() {
  if (!branchStore.activeBranchId) {
    apiClient.notifyError(new Error('branch is required'), 'Выберите филиал для категории.')
    return
  }

  editingId.value = null
  resetForm()
  createOpen.value = true
}

function openEdit(row: CategoryRow) {
  editingId.value = row.id
  form.name = row.name || ''
  form.sort_order = row.sort_order === null || row.sort_order === undefined ? '' : String(row.sort_order)
  form.is_active = row.is_active !== false
  editOpen.value = true
}

const { data, pending, refresh } = await useAsyncData('admin-service-categories', async () => {
  if (!branchStore.activeBranchId) {
    return { items: [], total: 0 }
  }

  return await categoriesApi.list(true)
}, {
  watch: [() => branchStore.activeBranchId]
})

const rows = computed<CategoryRow[]>(() =>
  ((data.value as any)?.items || []).flatMap((item: ServiceCategory) => {
    const row = toRow(item)
    return row ? [row] : []
  })
)

const nextSortOrder = computed(() => {
  const maxOrder = rows.value.reduce((max, row) => {
    const order = toIntegerOrNull(row.sort_order)
    return order === null ? max : Math.max(max, order)
  }, 0)

  return maxOrder + 1
})

const columns: TableColumn<CategoryRow>[] = [
  { accessorKey: 'sort_order', header: 'Очередь' },
  { accessorKey: 'name', header: 'Категория' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

async function submitCreate() {
  const branchId = branchStore.activeBranchId
  if (!branchId) {
    apiClient.notifyError(new Error('branch is required'), 'Выберите филиал для категории.')
    return
  }

  const name = normalizeText(form.name)
  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Введите название категории.')
    return
  }

  submitting.value = true
  try {
    const payload: ServiceCategoryFormPayload = {
      branch_id: branchId,
      is_active: Boolean(form.is_active),
      name,
      sort_order: toIntegerOrNull(form.sort_order) ?? nextSortOrder.value
    }

    await categoriesApi.create(payload)
    createOpen.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

async function submitEdit() {
  const id = editingId.value
  if (!id) return

  const name = normalizeText(form.name)
  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Введите название категории.')
    return
  }

  submitting.value = true
  try {
    await categoriesApi.update(id, {
      is_active: Boolean(form.is_active),
      name,
      sort_order: toIntegerOrNull(form.sort_order)
    })

    editOpen.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

async function removeRow(row: CategoryRow) {
  if (import.meta.client && !window.confirm(`Удалить категорию «${row.name}»?`)) {
    return
  }

  submitting.value = true
  try {
    await categoriesApi.remove(row.id)
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

function categoryKey(name: string) {
  return name.trim().toLocaleLowerCase('ru-RU')
}

async function cloneToAllBranches() {
  const sourceBranchId = branchStore.activeBranchId

  if (!sourceBranchId || !rows.value.length) {
    apiClient.notifyError(new Error('categories are required'), 'В активном филиале нет категорий для копирования.')
    return
  }

  const targets = branchStore.branches.filter(branch => String(branch.id) !== sourceBranchId)

  if (!targets.length) {
    apiClient.notifyError(new Error('branches are required'), 'Нет других филиалов для копирования.')
    return
  }

  const confirmed = !import.meta.client || window.confirm(
    `Синхронизировать ${rows.value.length} категорий в ${targets.length} филиалов? Категории, которых нет в активном филиале, будут удалены.`
  )

  if (!confirmed) return

  cloning.value = true

  try {
    let created = 0
    let deleted = 0
    let updated = 0

    for (const branch of targets) {
      const response = await apiClient.request<{ items?: ServiceCategory[] }>('/api/service-categories', {
        query: { __skipBranchScope: true, branch_id: branch.id, include_inactive: true },
        silent: true
      })
      const existingByName = new Map<string, CategoryRow[]>()

      for (const category of response.items || []) {
        const row = toRow(category)
        if (!row) continue

        const key = categoryKey(row.name)
        const group = existingByName.get(key) || []
        group.push(row)
        existingByName.set(key, group)
      }

      for (const source of rows.value) {
        const matches = existingByName.get(categoryKey(source.name)) || []
        const existing = matches.shift()
        const payload: ServiceCategoryFormPayload = {
          branch_id: String(branch.id),
          is_active: source.is_active !== false,
          name: source.name,
          sort_order: toIntegerOrNull(source.sort_order)
        }

        if (existing) {
          await apiClient.request(`/api/service-categories/${existing.id}`, {
            body: { is_active: payload.is_active, name: payload.name, sort_order: payload.sort_order },
            method: 'PATCH',
            silent: true
          })
          updated += 1
        }
        else {
          await apiClient.request('/api/service-categories', {
            body: payload,
            method: 'POST',
            silent: true
          })
          created += 1
        }
      }

      for (const remaining of existingByName.values()) {
        for (const category of remaining) {
          await apiClient.request(`/api/service-categories/${category.id}`, {
            method: 'DELETE',
            silent: true
          })
          deleted += 1
        }
      }
    }

    apiClient.notifySuccess('Категории синхронизированы', `Создано: ${created}. Обновлено: ${updated}. Удалено: ${deleted}.`)
  }
  finally {
    cloning.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="service-categories">
    <template #header>
      <UDashboardNavbar
        class="service-categories-navbar"
        title="Категории услуг"
        :ui="{ root: 'min-h-14 sm:min-h-16', right: 'gap-2 sm:gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="pending"
            variant="outline"
            aria-label="Обновить"
            @click="refresh()"
          >
            <span class="hidden sm:inline">Обновить</span>
          </UButton>
          <UButton
            color="neutral"
            icon="i-lucide-copy"
            :disabled="!branchStore.activeBranchId || !rows.length || submitting"
            :loading="cloning"
            variant="outline"
            aria-label="Клонировать на все филиалы"
            @click="cloneToAllBranches"
          >
            <span class="hidden sm:inline">Клонировать на все филиалы</span>
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            :disabled="!branchStore.activeBranchId"
            aria-label="Добавить категорию"
            @click="openCreate"
          >
            <span class="hidden sm:inline">Добавить категорию</span>
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UAlert
          v-if="!branchStore.activeBranchId"
          color="warning"
          icon="i-lucide-map-pin"
          title="Филиал не выбран"
          description="Выберите филиал в панели, чтобы управлять категориями услуг."
          variant="soft"
        />

        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-1">
                <h2 class="barbershop-heading text-xl text-charcoal-950">
                  Список категорий
                </h2>
                <p class="text-sm text-charcoal-500">
                  {{ branchStore.activeBranch?.name || 'Активный филиал не выбран' }}
                </p>
              </div>

              <UBadge color="neutral" size="lg" variant="soft">
                {{ rows.length }} шт.
              </UBadge>
            </div>
          </template>

          <div
            v-if="rows.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="columns" :data="rows">
              <template #sort_order-cell="{ row }">
                <UBadge color="neutral" size="xs" variant="soft">
                  {{ row.original.sort_order ?? '—' }}
                </UBadge>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  :color="row.original.is_active === false ? 'neutral' : 'success'"
                  size="xs"
                  variant="soft"
                >
                  {{ row.original.is_active === false ? 'Неактивна' : 'Активна' }}
                </UBadge>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEdit(row.original)" />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :loading="submitting"
                    @click="removeRow(row.original)"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <div v-else class="py-10 text-center text-sm text-charcoal-500">
            Категорий пока нет.
          </div>
        </UCard>
      </div>

      <UModal
        v-model:open="createOpen"
        class="sm:max-w-xl"
        title="Новая категория"
        description="Категория будет доступна в CRUD услуг активного филиала."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="form.name" placeholder="Например: Стрижки" />
            </UFormField>

            <UFormField label="Очередь показа">
              <UInput v-model="form.sort_order" type="number" :placeholder="String(nextSortOrder)" />
            </UFormField>

            <UFormField>
              <UCheckbox v-model="form.is_active" label="Активна" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="createOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" :loading="submitting" @click="submitCreate">
              Создать
            </UButton>
          </div>
        </template>
      </UModal>

      <UModal
        v-model:open="editOpen"
        class="sm:max-w-xl"
        title="Редактировать категорию"
        description="Если изменить название, услуги этой категории будут переименованы в бэкенде."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="form.name" placeholder="Например: Стрижки" />
            </UFormField>

            <UFormField label="Очередь показа">
              <UInput v-model="form.sort_order" type="number" :placeholder="String(nextSortOrder)" />
            </UFormField>

            <UFormField>
              <UCheckbox v-model="form.is_active" label="Активна" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="editOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" :loading="submitting" @click="submitEdit">
              Сохранить
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
