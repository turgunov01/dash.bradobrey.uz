<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

type CategoryRow = {
  id: string
  name: string
  description: string | null
  sort_order: number | null
  is_active: boolean | null
}

const warehouseApi = useWarehouseApi()
const apiClient = useApiClient()

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

function extractItems(value: unknown) {
  if (Array.isArray(value)) {
    return value as Record<string, any>[]
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  const source = value as Record<string, any>

  for (const key of ['items', 'data', 'rows', 'records', 'categories']) {
    const list = source[key]

    if (Array.isArray(list)) {
      return list as Record<string, any>[]
    }
  }

  if (source.data && typeof source.data === 'object') {
    return extractItems(source.data)
  }

  return []
}

const createOpen = ref(false)
const editOpen = ref(false)
const submitting = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  description: '',
  is_active: true,
  name: '',
  sort_order: ''
})

const { data, pending, refresh } = await useAsyncData('warehouse-categories', () => {
  return warehouseApi.categories()
}, {
  default: () => ({ items: [] })
})

const rows = computed<CategoryRow[]>(() =>
  extractItems(data.value).flatMap((item, index) => {
    const id = normalizeText(item.id || item.category_id) || `category-${index}`

    return [{
      description: normalizeText(item.description),
      id,
      is_active: item.is_active === undefined || item.is_active === null ? null : Boolean(item.is_active),
      name: normalizeText(item.name || item.title) || 'Категория',
      sort_order: toIntegerOrNull(item.sort_order)
    }]
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
  { accessorKey: 'description', header: 'Описание' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

function resetForm() {
  form.description = ''
  form.name = ''
  form.sort_order = String(nextSortOrder.value)
  form.is_active = true
}

function openCreate() {
  editingId.value = null
  resetForm()
  createOpen.value = true
}

function openEdit(row: CategoryRow) {
  editingId.value = row.id
  form.description = row.description || ''
  form.name = row.name || ''
  form.sort_order = row.sort_order === null || row.sort_order === undefined ? '' : String(row.sort_order)
  form.is_active = row.is_active !== false
  editOpen.value = true
}

async function submitCreate() {
  const name = normalizeText(form.name)
  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Введите название категории.')
    return
  }

  submitting.value = true
  try {
    await warehouseApi.createCategory({
      description: normalizeText(form.description),
      is_active: Boolean(form.is_active),
      name,
      sort_order: toIntegerOrNull(form.sort_order) ?? nextSortOrder.value
    })

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
    await warehouseApi.updateCategory(id, {
      description: normalizeText(form.description),
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
    await warehouseApi.deleteCategory(row.id)
    await refresh()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="warehouse-categories">
    <template #header>
      <UDashboardNavbar title="Склад · Категории" :ui="{ right: 'gap-3' }">
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
          <UButton color="primary" icon="i-lucide-plus" @click="openCreate">
            Добавить категорию
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-1">
                <h2 class="barbershop-heading text-xl text-charcoal-950">
                  Категории склада
                </h2>
                <p class="text-sm text-charcoal-500">
                  Управляйте категориями, чтобы группировать складские позиции.
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
            <UTable :columns="columns" :data="rows" :loading="pending">
              <template #sort_order-cell="{ row }">
                <UBadge color="neutral" size="xs" variant="soft">
                  {{ row.original.sort_order ?? '—' }}
                </UBadge>
              </template>

              <template #description-cell="{ row }">
                <span v-if="row.original.description">{{ row.original.description }}</span>
                <span v-else class="text-charcoal-400">—</span>
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
            Категорий пока нет. Добавьте первую категорию, чтобы группировать позиции.
          </div>
        </UCard>
      </div>

      <UModal
        v-model:open="createOpen"
        class="sm:max-w-xl"
        title="Новая категория"
        description="Категория будет доступна при создании складских позиций."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="form.name" placeholder="Например: Расходники" />
            </UFormField>

            <UFormField label="Описание">
              <UInput v-model="form.description" placeholder="Необязательно" />
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
        description="Изменения применяются сразу после сохранения."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="form.name" placeholder="Например: Расходники" />
            </UFormField>

            <UFormField label="Описание">
              <UInput v-model="form.description" placeholder="Необязательно" />
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
