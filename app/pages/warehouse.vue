<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { formatCount, formatDateTime, formatMoney } from '~/utils/format'

type WarehouseTab = 'positions' | 'purchases' | 'stocks' | 'templates'

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

type TemplateRow = {
  id: string
  name: string
  description: string | null
  items_count: number
  is_active: boolean | null
  raw: Record<string, any>
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

type PurchaseRow = {
  id: string
  branch: string
  branch_id: string | null
  position: string
  position_id: string | null
  quantity: number
  unit_price: number
  total_amount: number
  supplier: string | null
  status: string | null
  created_at: string | null
}

const warehouseApi = useWarehouseApi()
const branchStore = useBranchStore()
const apiClient = useApiClient()

await branchStore.ensureLoaded()

function currentPeriodKey() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

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

  for (const key of ['items', 'data', 'rows', 'records', 'positions', 'templates', 'stocks', 'purchases']) {
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
  return normalizeText(value.id || value.position_id || value.template_id || value.purchase_id || value.stock_id) || fallback
}

function branchNameById(id: string | null) {
  if (!id) return 'Филиал'
  return branchStore.branches.find(branch => String(branch.id) === id)?.name || id
}

function parseJsonField(value: string, fallback: unknown) {
  const text = normalizeText(value)

  if (!text) {
    return fallback
  }

  try {
    return JSON.parse(text)
  }
  catch {
    return text
  }
}

const period = ref(currentPeriodKey())
const activeTab = ref<WarehouseTab>('positions')
const submitting = ref(false)
const positionModalOpen = ref(false)
const templateModalOpen = ref(false)
const stockModalOpen = ref(false)
const purchaseModalOpen = ref(false)
const editingPositionId = ref<string | null>(null)
const editingTemplateId = ref<string | null>(null)
const editingStockId = ref<string | null>(null)
const editingPurchaseId = ref<string | null>(null)

const positionForm = reactive({
  category: '',
  is_active: true,
  min_quantity: 0,
  name: '',
  unit: 'шт'
})

const templateForm = reactive({
  description: '',
  is_active: true,
  items_json: '[]',
  name: ''
})

const stockForm = reactive({
  branch_id: '',
  position_id: '',
  quantity: 0,
  unit: ''
})

const purchaseForm = reactive({
  branch_id: '',
  position_id: '',
  purchased_at: '',
  quantity: 1,
  status: 'draft',
  supplier: '',
  total_amount: 0,
  unit_price: 0
})

const tabs = [
  { label: 'Позиции', value: 'positions' },
  { label: 'Остатки', value: 'stocks' },
  { label: 'Закупки', value: 'purchases' },
  { label: 'Шаблоны', value: 'templates' }
]

const statusOptions = [
  { label: 'Черновик', value: 'draft' },
  { label: 'В ожидании', value: 'pending' },
  { label: 'Получено', value: 'received' },
  { label: 'Отменено', value: 'cancelled' }
]

const { data: summaryData, pending: summaryPending, refresh: refreshSummary } = await useAsyncData('warehouse-summary', () => {
  return warehouseApi.summary({ period: period.value })
}, {
  default: () => ({}),
  watch: [period]
})

const { data: positionsData, pending: positionsPending, refresh: refreshPositions } = await useAsyncData('warehouse-positions', () => {
  return warehouseApi.positions()
}, {
  default: () => ({ items: [] })
})

const { data: templatesData, pending: templatesPending, refresh: refreshTemplates } = await useAsyncData('warehouse-templates', () => {
  return warehouseApi.templates()
}, {
  default: () => ({ items: [] })
})

const { data: stocksData, pending: stocksPending, refresh: refreshStocks } = await useAsyncData('warehouse-stocks', () => {
  return warehouseApi.stocks()
}, {
  default: () => ({ items: [] })
})

const { data: purchasesData, pending: purchasesPending, refresh: refreshPurchases } = await useAsyncData('warehouse-purchases', () => {
  return warehouseApi.purchases({ period: period.value })
}, {
  default: () => ({ items: [] }),
  watch: [period]
})

const branchOptions = computed<Option[]>(() =>
  branchStore.branches.map(branch => ({
    label: branch.name || String(branch.id),
    value: String(branch.id)
  }))
)

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

const positionOptions = computed<Option[]>(() =>
  positionRows.value.map(position => ({
    label: position.unit ? `${position.name} (${position.unit})` : position.name,
    value: position.id
  }))
)

const templateRows = computed<TemplateRow[]>(() =>
  extractItems(templatesData.value).map((item, index) => {
    const rawItems = Array.isArray(item.items)
      ? item.items
      : Array.isArray(item.positions)
        ? item.positions
        : []

    return {
      description: normalizeText(item.description),
      id: itemId(item, `template-${index}`),
      is_active: item.is_active === undefined || item.is_active === null ? null : Boolean(item.is_active),
      items_count: normalizeNumber(item.items_count || item.itemsCount || rawItems.length),
      name: normalizeText(item.name || item.title) || 'Шаблон',
      raw: item
    }
  })
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

const purchaseRows = computed<PurchaseRow[]>(() =>
  extractItems(purchasesData.value).map((item, index) => {
    const branchId = normalizeText(item.branch_id || item.branchId || item.object_id || item.objectId)
    const positionId = normalizeText(item.position_id || item.positionId || item.warehouse_position_id || item.warehousePositionId)
    const quantity = normalizeNumber(item.quantity || item.qty)
    const unitPrice = normalizeNumber(item.unit_price || item.unitPrice || item.price)
    const totalAmount = normalizeNumber(item.total_amount || item.totalAmount || item.amount) || quantity * unitPrice

    return {
      branch: normalizeText(item.branch_name || item.branchName || item.branch?.name) || branchNameById(branchId),
      branch_id: branchId,
      created_at: normalizeText(item.purchased_at || item.purchasedAt || item.received_at || item.created_at),
      id: itemId(item, `purchase-${index}`),
      position: normalizeText(item.position_name || item.positionName || item.name || item.position?.name)
        || positionRows.value.find(row => row.id === positionId)?.name
        || 'Позиция',
      position_id: positionId,
      quantity,
      status: normalizeText(item.status),
      supplier: normalizeText(item.supplier || item.supplier_name || item.vendor),
      total_amount: totalAmount,
      unit_price: unitPrice
    }
  })
)

const summary = computed(() => {
  const source = summaryData.value && typeof summaryData.value === 'object'
    ? summaryData.value as Record<string, any>
    : {}
  const data = source.summary && typeof source.summary === 'object'
    ? source.summary as Record<string, any>
    : source

  return {
    lowStock: normalizeNumber(data.low_stock || data.lowStock || data.low_stock_count),
    positions: normalizeNumber(data.positions || data.positions_count || data.positionsCount) || positionRows.value.length,
    purchases: normalizeNumber(data.purchases || data.purchases_total || data.purchase_total),
    stockValue: normalizeNumber(data.stock_value || data.stockValue || data.total_stock_value),
    stocks: normalizeNumber(data.stocks || data.stocks_count || data.stocksCount) || stockRows.value.length
  }
})

const loading = computed(() =>
  summaryPending.value
  || positionsPending.value
  || templatesPending.value
  || stocksPending.value
  || purchasesPending.value
)

const positionColumns: TableColumn<PositionRow>[] = [
  { accessorKey: 'name', header: 'Позиция' },
  { accessorKey: 'category', header: 'Категория' },
  { accessorKey: 'unit', header: 'Ед.' },
  { accessorKey: 'min_quantity', header: 'Мин. остаток' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

const templateColumns: TableColumn<TemplateRow>[] = [
  { accessorKey: 'name', header: 'Шаблон' },
  { accessorKey: 'description', header: 'Описание' },
  { accessorKey: 'items_count', header: 'Позиций' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

const stockColumns: TableColumn<StockRow>[] = [
  { accessorKey: 'branch', header: 'Филиал' },
  { accessorKey: 'position', header: 'Позиция' },
  { accessorKey: 'quantity', header: 'Остаток' },
  { accessorKey: 'updated_at', header: 'Обновлено' },
  { id: 'actions', header: '' }
]

const purchaseColumns: TableColumn<PurchaseRow>[] = [
  { accessorKey: 'position', header: 'Позиция' },
  { accessorKey: 'branch', header: 'Филиал' },
  { accessorKey: 'quantity', header: 'Кол-во' },
  { accessorKey: 'total_amount', header: 'Сумма' },
  { accessorKey: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

async function refreshAll() {
  await Promise.allSettled([
    refreshSummary(),
    refreshPositions(),
    refreshTemplates(),
    refreshStocks(),
    refreshPurchases()
  ])
}

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
    await Promise.all([refreshPositions(), refreshSummary()])
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
    await Promise.all([refreshPositions(), refreshSummary()])
  }
  finally {
    submitting.value = false
  }
}

function resetTemplateForm() {
  templateForm.description = ''
  templateForm.is_active = true
  templateForm.items_json = '[]'
  templateForm.name = ''
}

function openCreateTemplate() {
  editingTemplateId.value = null
  resetTemplateForm()
  templateModalOpen.value = true
}

function openEditTemplate(row: TemplateRow) {
  editingTemplateId.value = row.id
  templateForm.description = row.description || ''
  templateForm.is_active = row.is_active !== false
  templateForm.items_json = JSON.stringify(row.raw.items || row.raw.positions || [], null, 2)
  templateForm.name = row.name
  templateModalOpen.value = true
}

async function submitTemplate() {
  const name = normalizeText(templateForm.name)

  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Укажите название шаблона.')
    return
  }

  submitting.value = true

  try {
    const payload = {
      description: normalizeText(templateForm.description),
      is_active: Boolean(templateForm.is_active),
      items: parseJsonField(templateForm.items_json, []),
      name
    }

    if (editingTemplateId.value) {
      await warehouseApi.updateTemplate(editingTemplateId.value, payload)
    }
    else {
      await warehouseApi.createTemplate(payload)
    }

    templateModalOpen.value = false
    await refreshTemplates()
  }
  finally {
    submitting.value = false
  }
}

async function deleteTemplate(row: TemplateRow) {
  if (import.meta.client && !window.confirm(`Удалить шаблон «${row.name}»?`)) {
    return
  }

  submitting.value = true

  try {
    await warehouseApi.deleteTemplate(row.id)
    await refreshTemplates()
  }
  finally {
    submitting.value = false
  }
}

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
    await Promise.all([refreshStocks(), refreshSummary()])
  }
  finally {
    submitting.value = false
  }
}

function resetPurchaseForm() {
  purchaseForm.branch_id = branchStore.activeBranchId || branchOptions.value[0]?.value || ''
  purchaseForm.position_id = positionOptions.value[0]?.value || ''
  purchaseForm.purchased_at = new Date().toISOString().slice(0, 10)
  purchaseForm.quantity = 1
  purchaseForm.status = 'draft'
  purchaseForm.supplier = ''
  purchaseForm.total_amount = 0
  purchaseForm.unit_price = 0
}

function openCreatePurchase() {
  editingPurchaseId.value = null
  resetPurchaseForm()
  purchaseModalOpen.value = true
}

function openEditPurchase(row: PurchaseRow) {
  editingPurchaseId.value = row.id
  purchaseForm.branch_id = row.branch_id || branchStore.activeBranchId || ''
  purchaseForm.position_id = row.position_id || ''
  purchaseForm.purchased_at = row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10)
  purchaseForm.quantity = row.quantity
  purchaseForm.status = row.status || 'draft'
  purchaseForm.supplier = row.supplier || ''
  purchaseForm.total_amount = row.total_amount
  purchaseForm.unit_price = row.unit_price
  purchaseModalOpen.value = true
}

async function submitPurchase() {
  if (!purchaseForm.branch_id || !purchaseForm.position_id) {
    apiClient.notifyError(new Error('branch and position are required'), 'Выберите филиал и позицию.')
    return
  }

  submitting.value = true

  try {
    const quantity = normalizeNumber(purchaseForm.quantity)
    const unitPrice = normalizeNumber(purchaseForm.unit_price)
    const totalAmount = normalizeNumber(purchaseForm.total_amount) || quantity * unitPrice
    const payload = {
      branch_id: purchaseForm.branch_id,
      position_id: purchaseForm.position_id,
      purchased_at: normalizeText(purchaseForm.purchased_at),
      quantity,
      status: normalizeText(purchaseForm.status),
      supplier: normalizeText(purchaseForm.supplier),
      total_amount: totalAmount,
      unit_price: unitPrice
    }

    if (editingPurchaseId.value) {
      await warehouseApi.updatePurchase(editingPurchaseId.value, payload)
    }
    else {
      await warehouseApi.createPurchase(payload)
    }

    purchaseModalOpen.value = false
    await Promise.all([refreshPurchases(), refreshStocks(), refreshSummary()])
  }
  finally {
    submitting.value = false
  }
}

async function deletePurchase(row: PurchaseRow) {
  if (import.meta.client && !window.confirm(`Удалить закупку «${row.position}»?`)) {
    return
  }

  submitting.value = true

  try {
    await warehouseApi.deletePurchase(row.id)
    await Promise.all([refreshPurchases(), refreshSummary()])
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="warehouse">
    <template #header>
      <UDashboardNavbar title="Склад" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UInput v-model="period" type="month" size="sm" class="w-[9.5rem]" />
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="loading" variant="outline" @click="refreshAll">
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <DashboardMetricCard
            description="Количество складских позиций."
            icon="i-lucide-box"
            label="Позиции"
            :value="formatCount(summary.positions)"
          />
          <DashboardMetricCard
            description="Текущие строки остатков по филиалам."
            icon="i-lucide-warehouse"
            label="Остатки"
            :value="formatCount(summary.stocks)"
          />
          <DashboardMetricCard
            description="Закупки за выбранный месяц."
            icon="i-lucide-shopping-cart"
            label="Закупки"
            :value="formatMoney(summary.purchases)"
          />
          <DashboardMetricCard
            description="Оценочная стоимость остатков."
            icon="i-lucide-coins"
            label="Стоимость"
            :value="formatMoney(summary.stockValue)"
          />
          <DashboardMetricCard
            description="Позиции ниже минимального остатка."
            icon="i-lucide-triangle-alert"
            label="Низкий остаток"
            :value="formatCount(summary.lowStock)"
          />
        </div>

        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="overflow-x-auto">
                <UTabs
                  v-model="activeTab"
                  :content="false"
                  :items="tabs"
                  value-key="value"
                />
              </div>

              <div class="flex flex-wrap gap-2">
                <UButton
                  v-if="activeTab === 'positions'"
                  color="primary"
                  icon="i-lucide-plus"
                  @click="openCreatePosition"
                >
                  Создать позицию
                </UButton>
                <UButton
                  v-if="activeTab === 'stocks'"
                  color="primary"
                  icon="i-lucide-plus"
                  :disabled="!branchOptions.length || !positionOptions.length"
                  @click="openCreateStock"
                >
                  Добавить остаток
                </UButton>
                <UButton
                  v-if="activeTab === 'purchases'"
                  color="primary"
                  icon="i-lucide-plus"
                  :disabled="!branchOptions.length || !positionOptions.length"
                  @click="openCreatePurchase"
                >
                  Создать закупку
                </UButton>
                <UButton
                  v-if="activeTab === 'templates'"
                  color="primary"
                  icon="i-lucide-plus"
                  @click="openCreateTemplate"
                >
                  Создать шаблон
                </UButton>
              </div>
            </div>
          </template>

          <div v-if="activeTab === 'positions'" class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <UTable :columns="positionColumns" :data="positionRows" :loading="positionsPending">
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

          <div v-else-if="activeTab === 'stocks'" class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
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

          <div v-else-if="activeTab === 'purchases'" class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <UTable :columns="purchaseColumns" :data="purchaseRows" :loading="purchasesPending">
              <template #quantity-cell="{ row }">
                {{ formatCount(row.original.quantity) }}
              </template>
              <template #total_amount-cell="{ row }">
                <span class="font-semibold text-charcoal-950">
                  {{ formatMoney(row.original.total_amount) }}
                </span>
              </template>
              <template #status-cell="{ row }">
                <SharedStatusBadge :label="row.original.status" />
              </template>
              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEditPurchase(row.original)" />
                  <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" :loading="submitting" @click="deletePurchase(row.original)" />
                </div>
              </template>
            </UTable>
          </div>

          <div v-else class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <UTable :columns="templateColumns" :data="templateRows" :loading="templatesPending">
              <template #items_count-cell="{ row }">
                {{ formatCount(row.original.items_count) }}
              </template>
              <template #status-cell="{ row }">
                <UBadge :color="row.original.is_active === false ? 'neutral' : 'success'" size="xs" variant="soft">
                  {{ row.original.is_active === false ? 'Неактивен' : 'Активен' }}
                </UBadge>
              </template>
              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEditTemplate(row.original)" />
                  <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" :loading="submitting" @click="deleteTemplate(row.original)" />
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
                <UInput v-model="positionForm.category" />
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

      <UModal v-model:open="templateModalOpen" class="sm:max-w-2xl" :title="editingTemplateId ? 'Редактировать шаблон' : 'Новый шаблон'">
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="templateForm.name" />
            </UFormField>
            <UFormField label="Описание">
              <UInput v-model="templateForm.description" />
            </UFormField>
            <UFormField label="Состав JSON">
              <UTextarea v-model="templateForm.items_json" :rows="7" />
            </UFormField>
            <UFormField>
              <UCheckbox v-model="templateForm.is_active" label="Активен" />
            </UFormField>
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="templateModalOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submitTemplate">
              Сохранить
            </UButton>
          </div>
        </template>
      </UModal>

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

      <UModal v-model:open="purchaseModalOpen" class="sm:max-w-2xl" :title="editingPurchaseId ? 'Редактировать закупку' : 'Новая закупка'">
        <template #body>
          <div class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Филиал" required>
                <USelectMenu v-model="purchaseForm.branch_id" :items="branchOptions" value-key="value" class="w-full" />
              </UFormField>
              <UFormField label="Позиция" required>
                <USelectMenu v-model="purchaseForm.position_id" :items="positionOptions" value-key="value" class="w-full" />
              </UFormField>
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              <UFormField label="Количество">
                <UInput v-model="purchaseForm.quantity" type="number" min="0" step="0.01" />
              </UFormField>
              <UFormField label="Цена за ед.">
                <UInput v-model="purchaseForm.unit_price" type="number" min="0" />
              </UFormField>
              <UFormField label="Сумма">
                <UInput v-model="purchaseForm.total_amount" type="number" min="0" />
              </UFormField>
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              <UFormField label="Поставщик">
                <UInput v-model="purchaseForm.supplier" />
              </UFormField>
              <UFormField label="Дата">
                <UInput v-model="purchaseForm.purchased_at" type="date" />
              </UFormField>
              <UFormField label="Статус">
                <USelectMenu v-model="purchaseForm.status" :items="statusOptions" value-key="value" class="w-full" />
              </UFormField>
            </div>
            <UAlert
              v-if="purchaseForm.status === 'received'"
              color="primary"
              icon="i-lucide-package-check"
              variant="soft"
              title="После сохранения backend увеличит остатки"
              description="Статус received автоматически применяет закупку к складу."
            />
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="purchaseModalOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" icon="i-lucide-save" :loading="submitting" @click="submitPurchase">
              Сохранить
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
