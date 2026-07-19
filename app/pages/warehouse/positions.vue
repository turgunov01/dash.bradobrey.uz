<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { formatCount } from '~/utils/format'

type Option = {
  label: string
  value: string
}

type PositionRow = {
  id: string
  name: string
  category: string | null
  unit: string | null
  min_quantity: number
  is_active: boolean | null
}

type CategoryRow = {
  id: string
  name: string
  is_active: boolean | null
}

const warehouseApi = useWarehouseApi()
const apiClient = useApiClient()

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function normalizeNumber(value: unknown) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function extractItems(value: unknown) {
  if (Array.isArray(value)) {
    return value as Record<string, any>[]
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  const source = value as Record<string, any>

  for (const key of ['items', 'data', 'rows', 'records', 'positions', 'categories']) {
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

function itemId(value: Record<string, any>, fallback: string) {
  return normalizeText(value.id || value.position_id || value.category_id) || fallback
}

const submitting = ref(false)
const positionModalOpen = ref(false)
const editingPositionId = ref<string | null>(null)

const positionForm = reactive({
  category: '',
  is_active: true,
  min_quantity: 0,
  name: '',
  unit: 'шт'
})

const { data: positionsData, pending: positionsPending, refresh: refreshPositions } = await useAsyncData('warehouse-positions', () => {
  return warehouseApi.positions()
}, {
  default: () => ({ items: [] })
})

const { data: categoriesData, refresh: refreshCategories } = await useAsyncData('warehouse-categories-options', () => {
  return warehouseApi.categories()
}, {
  default: () => ({ items: [] })
})

const positionRows = computed<PositionRow[]>(() =>
  extractItems(positionsData.value).map((item, index) => ({
    category: normalizeText(item.category || item.group || item.type),
    id: itemId(item, `position-${index}`),
    is_active: item.is_active === undefined || item.is_active === null ? null : Boolean(item.is_active),
    min_quantity: normalizeNumber(item.min_quantity || item.minQuantity || item.min_stock || item.minStock),
    name: normalizeText(item.name || item.title) || 'Позиция',
    unit: normalizeText(item.unit || item.measure)
  }))
)

const categoryRows = computed<CategoryRow[]>(() =>
  extractItems(categoriesData.value).map((item, index) => ({
    id: itemId(item, `category-${index}`),
    is_active: item.is_active === undefined || item.is_active === null ? null : Boolean(item.is_active),
    name: normalizeText(item.name || item.title) || 'Категория'
  }))
)

const categoryOptions = computed<Option[]>(() => {
  const names = new Set<string>()

  for (const category of categoryRows.value) {
    if (category.is_active !== false && category.name) names.add(category.name)
  }
  for (const position of positionRows.value) {
    if (position.category) names.add(position.category)
  }

  return [
    { label: 'Без категории', value: '' },
    ...Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({ label: name, value: name }))
  ]
})

const positionColumns: TableColumn<PositionRow>[] = [
  { accessorKey: 'name', header: 'Позиция' },
  { accessorKey: 'category', header: 'Категория' },
  { accessorKey: 'unit', header: 'Ед.' },
  { accessorKey: 'min_quantity', header: 'Мин. остаток' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

function resetPositionForm() {
  positionForm.category = ''
  positionForm.is_active = true
  positionForm.min_quantity = 0
  positionForm.name = ''
  positionForm.unit = 'шт'
}

function openCreatePosition() {
  editingPositionId.value = null
  resetPositionForm()
  positionModalOpen.value = true
}

function openEditPosition(row: PositionRow) {
  editingPositionId.value = row.id
  positionForm.category = row.category || ''
  positionForm.is_active = row.is_active !== false
  positionForm.min_quantity = row.min_quantity
  positionForm.name = row.name
  positionForm.unit = row.unit || ''
  positionModalOpen.value = true
}

async function submitPosition() {
  const name = normalizeText(positionForm.name)

  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Укажите название позиции.')
    return
  }

  submitting.value = true

  try {
    const payload = {
      category: normalizeText(positionForm.category),
      is_active: Boolean(positionForm.is_active),
      min_quantity: normalizeNumber(positionForm.min_quantity),
      name,
      unit: normalizeText(positionForm.unit)
    }

    if (editingPositionId.value) {
      await warehouseApi.updatePosition(editingPositionId.value, payload)
    }
    else {
      await warehouseApi.createPosition(payload)
    }

    positionModalOpen.value = false
    await Promise.all([refreshPositions(), refreshCategories()])
  }
  finally {
    submitting.value = false
  }
}

async function deletePosition(row: PositionRow) {
  if (import.meta.client && !window.confirm(`Удалить позицию «${row.name}»?`)) {
    return
  }

  submitting.value = true

  try {
    await warehouseApi.deletePosition(row.id)
    await refreshPositions()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="warehouse-positions">
    <template #header>
      <UDashboardNavbar title="Склад · Позиции" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="positionsPending" variant="outline" @click="refreshPositions()">
            Обновить
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" @click="openCreatePosition">
            Создать позицию
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <WarehouseSummaryCards :positions-count="positionRows.length" />

        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-1">
              <h2 class="barbershop-heading text-xl text-charcoal-950">
                Складские позиции
              </h2>
              <p class="text-sm text-charcoal-500">
                Номенклатура товаров и расходников с минимальными остатками.
              </p>
            </div>
          </template>

          <div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <UTable :columns="positionColumns" :data="positionRows" :loading="positionsPending">
              <template #category-cell="{ row }">
                <UBadge v-if="row.original.category" color="neutral" size="xs" variant="soft">
                  {{ row.original.category }}
                </UBadge>
                <span v-else class="text-charcoal-400">—</span>
              </template>
              <template #min_quantity-cell="{ row }">
                {{ formatCount(row.original.min_quantity) }}
              </template>
              <template #status-cell="{ row }">
                <UBadge :color="row.original.is_active === false ? 'neutral' : 'success'" size="xs" variant="soft">
                  {{ row.original.is_active === false ? 'Неактивна' : 'Активна' }}
                </UBadge>
              </template>
              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEditPosition(row.original)" />
                  <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" :loading="submitting" @click="deletePosition(row.original)" />
                </div>
              </template>
            </UTable>
          </div>
        </UCard>
      </div>

      <UModal v-model:open="positionModalOpen" class="sm:max-w-xl" :title="editingPositionId ? 'Редактировать позицию' : 'Новая позиция'">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="positionForm.name" />
            </UFormField>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Категория">
                <USelectMenu v-model="positionForm.category" :items="categoryOptions" value-key="value" class="w-full" />
              </UFormField>
              <UFormField label="Единица">
                <UInput v-model="positionForm.unit" placeholder="шт, мл, кг" />
              </UFormField>
            </div>
            <UFormField label="Минимальный остаток">
              <UInput v-model="positionForm.min_quantity" type="number" min="0" />
            </UFormField>
            <UFormField>
              <UCheckbox v-model="positionForm.is_active" label="Активна" />
            </UFormField>
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="positionModalOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submitPosition">
              Сохранить
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
