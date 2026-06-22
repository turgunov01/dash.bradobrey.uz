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
</script>

<template>
  <UDashboardPanel id="service-categories">
    <template #header>
      <UDashboardNavbar title="Категории услуг" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="pending"
            variant="outline"
            @click="refresh()"
          >
            Обновить
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" :disabled="!branchStore.activeBranchId" @click="openCreate">
            Добавить категорию
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
