<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { formatCount, formatMoney } from '~/utils/format'

type Option = {
  label: string
  value: string
}

type PositionRow = {
  id: string
  name: string
  unit: string | null
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

  for (const key of ['items', 'data', 'rows', 'records', 'positions', 'purchases']) {
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
  return normalizeText(value.id || value.position_id || value.purchase_id) || fallback
}

function branchNameById(id: string | null) {
  if (!id) return 'Филиал'
  return branchStore.branches.find(branch => String(branch.id) === id)?.name || id
}

const period = ref(currentPeriodKey())
const submitting = ref(false)
const purchaseModalOpen = ref(false)
const editingPurchaseId = ref<string | null>(null)

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

const statusOptions = [
  { label: 'Черновик', value: 'draft' },
  { label: 'В ожидании', value: 'ordered' },
  { label: 'Получено', value: 'received' },
  { label: 'Отменено', value: 'cancelled' }
]

const { data: positionsData } = await useAsyncData('warehouse-positions', () => {
  return warehouseApi.positions()
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

const purchaseColumns: TableColumn<PurchaseRow>[] = [
  { accessorKey: 'position', header: 'Позиция' },
  { accessorKey: 'branch', header: 'Филиал' },
  { accessorKey: 'quantity', header: 'Кол-во' },
  { accessorKey: 'total_amount', header: 'Сумма' },
  { accessorKey: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

function resetPurchaseForm() {
  purchaseForm.branch_id = branchStore.activeBranchId || branchOptions.value[0]?.value || ''
  purchaseForm.position_id = positionOptions.value[0]?.value || ''
  purchaseForm.purchased_at = new Date().toISOString().slice(0, 10)
  purchaseForm.quantity = 1
  purchaseForm.status = 'ordered'
  purchaseForm.supplier = ''
  purchaseForm.total_amount = 0
  purchaseForm.unit_price = 0
}

watch([
  () => purchaseForm.quantity,
  () => purchaseForm.unit_price
], () => {
  const quantity = normalizeNumber(purchaseForm.quantity)
  const unitPrice = normalizeNumber(purchaseForm.unit_price)

  if (quantity > 0 && unitPrice > 0) {
    purchaseForm.total_amount = quantity * unitPrice
  }
})

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

  const quantity = normalizeNumber(purchaseForm.quantity)
  const unitPrice = normalizeNumber(purchaseForm.unit_price)
  const purchasedAt = normalizeText(purchaseForm.purchased_at)
  const supplier = normalizeText(purchaseForm.supplier)

  if (!purchasedAt || !supplier || quantity <= 0 || unitPrice <= 0) {
    apiClient.notifyError(
      new Error('purchase fields are required'),
      'Укажите поставщика, дату, количество и цену за единицу больше нуля.'
    )
    return
  }

  submitting.value = true

  try {
    const totalAmount = normalizeNumber(purchaseForm.total_amount) || quantity * unitPrice
    const payload = {
      branch_id: purchaseForm.branch_id,
      purchased_at: purchasedAt,
      status: normalizeText(purchaseForm.status),
      supplier_name: supplier,
      total_amount: totalAmount,
      items: [{
        position_id: purchaseForm.position_id,
        quantity,
        total_amount: totalAmount,
        unit_cost: unitPrice
      }]
    }

    if (editingPurchaseId.value) {
      await warehouseApi.updatePurchase(editingPurchaseId.value, payload)
    }
    else {
      await warehouseApi.createPurchase(payload)
    }

    purchaseModalOpen.value = false
    await refreshPurchases()
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
    await refreshPurchases()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="warehouse-purchases">
    <template #header>
      <UDashboardNavbar
        class="responsive-dashboard-navbar"
        title="Склад · Закупки"
        :ui="{ root: 'min-h-14 sm:min-h-16', right: 'gap-2 sm:gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UInput v-model="period" type="month" size="sm" class="w-32 sm:w-[9.5rem]" aria-label="Период закупок" />
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="purchasesPending"
            variant="outline"
            aria-label="Обновить"
            @click="refreshPurchases()"
          >
            <span class="hidden sm:inline">Обновить</span>
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            :disabled="!branchOptions.length || !positionOptions.length"
            aria-label="Создать закупку"
            @click="openCreatePurchase"
          >
            <span class="hidden sm:inline">Создать закупку</span>
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <WarehouseSummaryCards />

        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-1">
              <h2 class="barbershop-heading text-xl text-charcoal-950">
                Закупки
              </h2>
              <p class="text-sm text-charcoal-500">
                История поступлений товаров и расходников от поставщиков.
              </p>
            </div>
          </template>

          <div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
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
        </UCard>
      </div>

      <UModal v-model:open="purchaseModalOpen" class="sm:max-w-2xl" :title="editingPurchaseId ? 'Редактировать закупку' : 'Новая закупка'">
        <template #body>
          <div class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Филиал" required>
                <USelectMenu v-model="purchaseForm.branch_id" :items="branchOptions" value-key="value" class="w-full" portal="body" />
              </UFormField>
              <UFormField label="Позиция" required>
                <USelectMenu v-model="purchaseForm.position_id" :items="positionOptions" value-key="value" class="w-full" portal="body" />
              </UFormField>
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              <UFormField label="Количество" required>
                <UInput v-model="purchaseForm.quantity" type="number" min="0.01" step="0.01" />
              </UFormField>
              <UFormField label="Цена за ед." required>
                <UInput v-model="purchaseForm.unit_price" type="number" min="1" />
              </UFormField>
              <UFormField label="Сумма" required>
                <UInput v-model="purchaseForm.total_amount" type="number" min="1" />
              </UFormField>
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              <UFormField label="Поставщик" required>
                <UInput v-model="purchaseForm.supplier" />
              </UFormField>
              <UFormField label="Дата" required>
                <UInput v-model="purchaseForm.purchased_at" type="date" />
              </UFormField>
              <UFormField label="Статус">
                <USelectMenu v-model="purchaseForm.status" :items="statusOptions" value-key="value" class="w-full" portal="body" />
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
