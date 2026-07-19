<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { formatCount, formatDateTime } from '~/utils/format'

type Option = {
  label: string
  value: string
}

type PositionRow = {
  id: string
  name: string
  unit: string | null
}

type StockRow = {
  id: string
  branch: string
  branch_id: string | null
  position: string
  position_id: string | null
  quantity: number
  unit: string | null
  updated_at: string | null
}

const warehouseApi = useWarehouseApi()
const branchStore = useBranchStore()
const apiClient = useApiClient()

await branchStore.ensureLoaded()

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

  for (const key of ['items', 'data', 'rows', 'records', 'positions', 'stocks']) {
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
  return normalizeText(value.id || value.position_id || value.stock_id) || fallback
}

function branchNameById(id: string | null) {
  if (!id) return 'Филиал'
  return branchStore.branches.find(branch => String(branch.id) === id)?.name || id
}

const submitting = ref(false)
const stockModalOpen = ref(false)
const editingStockId = ref<string | null>(null)

const stockForm = reactive({
  branch_id: '',
  position_id: '',
  quantity: 0,
  unit: ''
})

const { data: positionsData } = await useAsyncData('warehouse-positions', () => {
  return warehouseApi.positions()
}, {
  default: () => ({ items: [] })
})

const { data: stocksData, pending: stocksPending, refresh: refreshStocks } = await useAsyncData('warehouse-stocks', () => {
  return warehouseApi.stocks()
}, {
  default: () => ({ items: [] })
})

const branchOptions = computed<Option[]>(() =>
  branchStore.branches.map(branch => ({
    label: branch.name || String(branch.id),
    value: String(branch.id)
  }))
)

const positionRows = computed<PositionRow[]>(() =>
  extractItems(positionsData.value).map((item, index) => ({
    id: itemId(item, `position-${index}`),
    name: normalizeText(item.name || item.title) || 'Позиция',
    unit: normalizeText(item.unit || item.measure)
  }))
)

const positionOptions = computed<Option[]>(() =>
  positionRows.value.map(position => ({
    label: position.unit ? `${position.name} (${position.unit})` : position.name,
    value: position.id
  }))
)

const stockRows = computed<StockRow[]>(() =>
  extractItems(stocksData.value).map((item, index) => {
    const branchId = normalizeText(item.branch_id || item.branchId || item.object_id || item.objectId)
    const positionId = normalizeText(item.position_id || item.positionId || item.warehouse_position_id || item.warehousePositionId)
    const position = normalizeText(item.position_name || item.positionName || item.name || item.position?.name)
      || positionRows.value.find(row => row.id === positionId)?.name
      || 'Позиция'

    return {
      branch: normalizeText(item.branch_name || item.branchName || item.branch?.name) || branchNameById(branchId),
      branch_id: branchId,
      id: itemId(item, `${branchId || 'branch'}:${positionId || index}`),
      position,
      position_id: positionId,
      quantity: normalizeNumber(item.quantity || item.qty || item.amount),
      unit: normalizeText(item.unit || item.measure) || positionRows.value.find(row => row.id === positionId)?.unit || null,
      updated_at: normalizeText(item.updated_at || item.updatedAt || item.created_at)
    }
  })
)

const stockColumns: TableColumn<StockRow>[] = [
  { accessorKey: 'branch', header: 'Филиал' },
  { accessorKey: 'position', header: 'Позиция' },
  { accessorKey: 'quantity', header: 'Остаток' },
  { accessorKey: 'updated_at', header: 'Обновлено' },
  { id: 'actions', header: '' }
]

function resetStockForm() {
  stockForm.branch_id = branchStore.activeBranchId || branchOptions.value[0]?.value || ''
  stockForm.position_id = positionOptions.value[0]?.value || ''
  stockForm.quantity = 0
  stockForm.unit = ''
}

function openCreateStock() {
  editingStockId.value = null
  resetStockForm()
  stockModalOpen.value = true
}

function openEditStock(row: StockRow) {
  editingStockId.value = row.id
  stockForm.branch_id = row.branch_id || branchStore.activeBranchId || ''
  stockForm.position_id = row.position_id || ''
  stockForm.quantity = row.quantity
  stockForm.unit = row.unit || ''
  stockModalOpen.value = true
}

async function submitStock() {
  if (!stockForm.branch_id || !stockForm.position_id) {
    apiClient.notifyError(new Error('branch and position are required'), 'Выберите филиал и позицию.')
    return
  }

  submitting.value = true

  try {
    const payload = {
      branch_id: stockForm.branch_id,
      position_id: stockForm.position_id,
      quantity: normalizeNumber(stockForm.quantity),
      unit: normalizeText(stockForm.unit)
    }

    if (editingStockId.value) {
      await warehouseApi.saveStock(payload)
    }
    else {
      await warehouseApi.createStock(payload)
    }

    stockModalOpen.value = false
    await refreshStocks()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="warehouse-stocks">
    <template #header>
      <UDashboardNavbar title="Склад · Остатки" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="stocksPending" variant="outline" @click="refreshStocks()">
            Обновить
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            :disabled="!branchOptions.length || !positionOptions.length"
            @click="openCreateStock"
          >
            Добавить остаток
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <WarehouseSummaryCards :stocks-count="stockRows.length" />

        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-1">
              <h2 class="barbershop-heading text-xl text-charcoal-950">
                Остатки по филиалам
              </h2>
              <p class="text-sm text-charcoal-500">
                Текущее количество позиций на складах каждого филиала.
              </p>
            </div>
          </template>

          <div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <UTable :columns="stockColumns" :data="stockRows" :loading="stocksPending">
              <template #quantity-cell="{ row }">
                <span class="font-semibold text-charcoal-950">
                  {{ formatCount(row.original.quantity) }} {{ row.original.unit || '' }}
                </span>
              </template>
              <template #updated_at-cell="{ row }">
                {{ row.original.updated_at ? formatDateTime(row.original.updated_at) : '—' }}
              </template>
              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEditStock(row.original)" />
                </div>
              </template>
            </UTable>
          </div>
        </UCard>
      </div>

      <UModal v-model:open="stockModalOpen" class="sm:max-w-xl" :title="editingStockId ? 'Редактировать остаток' : 'Новый остаток'">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Филиал" required>
              <USelectMenu v-model="stockForm.branch_id" :items="branchOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField label="Позиция" required>
              <USelectMenu v-model="stockForm.position_id" :items="positionOptions" value-key="value" class="w-full" />
            </UFormField>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Количество">
                <UInput v-model="stockForm.quantity" type="number" min="0" step="0.01" />
              </UFormField>
              <UFormField label="Единица">
                <UInput v-model="stockForm.unit" />
              </UFormField>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="stockModalOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submitStock">
              Сохранить
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
