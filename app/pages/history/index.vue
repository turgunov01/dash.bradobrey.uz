<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { HistoryItem } from '~~/shared/schemas'
import { formatDateTime, formatMoney } from '~/utils/format'
import { formatPaymentMethod } from '~/utils/display'
import { flattenServicesPayload } from '~/utils/services'

function extractHistoryItems(response: unknown): HistoryItem[] {
  if (Array.isArray(response)) {
    return response as HistoryItem[]
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    data?: HistoryItem[] | { items?: HistoryItem[] }
    items?: HistoryItem[]
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.data?.items)) {
    return payload.data.items
  }

  return []
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()

  return text || null
}

function getClientPhone(item: Record<string, any>) {
  return normalizeText(
    item.phone_number
    || item.phone
    || item.client?.phone
    || item.client?.phone_number
    || item.customer?.phone
  )
}

function getClientName(item: Record<string, any>) {
  return normalizeText(
    item.customer_name
    || item.client?.name
    || item.user_name
  )
}

const serviceNameMap = computed(() =>
  new Map(
    (servicesData.value || []).map((svc: any) => [String(svc.id), svc.name || `Услуга ${svc.id}`])
  )
)

function getServiceNames(item: Record<string, any>) {
  const ids = Array.isArray(item.service_ids)
    ? item.service_ids
    : item.service_id
      ? [item.service_id]
      : []

  return ids
    .map((id: any) => {
      const key = String(id)
      return serviceNameMap.value.get(key) || key
    })
    .filter(Boolean)
}

function sanitizeFilenameSegment(value: string) {
  const sanitized = value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim()
  return sanitized || 'export'
}

function formatExportTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`
}

function escapeCsvCell(value: unknown, delimiter: string) {
  if (value === undefined || value === null) {
    return ''
  }

  const text = String(value)
  const shouldQuote = text.includes('"') || text.includes('\n') || text.includes('\r') || text.includes(delimiter)
  const escaped = text.replace(/"/g, '""')

  return shouldQuote ? `"${escaped}"` : escaped
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  if (!import.meta.client) {
    return
  }

  const blob = new Blob([content], { type: mimeType })
  const url = globalThis.URL?.createObjectURL(blob)

  if (!url) {
    throw new Error('Не удалось сформировать файл экспорта.')
  }

  const link = globalThis.document?.createElement('a')

  if (!link) {
    throw new Error('Не удалось сформировать ссылку для экспорта.')
  }

  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.click()

  globalThis.URL?.revokeObjectURL(url)
}

const branchStore = useBranchStore()
const historyApi = useHistoryApi()
const kioskApi = useKioskApi()

const page = ref(1)
const itemsPerPage = 10
const exporting = ref(false)

await branchStore.ensureLoaded()

const columns: TableColumn<any>[] = [
  { accessorKey: 'client', header: 'КЛИЕНТ' },
  { accessorKey: 'phone', header: 'ТЕЛЕФОН' },
  { accessorKey: 'status', header: 'СТАТУС' },
  { accessorKey: 'payment_method', header: 'ОПЛАТА' },
  { accessorKey: 'amount', header: 'СУММА' },
  { accessorKey: 'created_at', header: 'СОЗДАНО' },
  { id: 'actions', header: '' }
]

const { data, pending, refresh } = await useAsyncData('history-current-filter', async () => {
  const query = branchStore.activeBranchId
    ? { branch_id: branchStore.activeBranchId }
    : {}

  const response = await historyApi.list(query)

  return extractHistoryItems(response)
}, {
  watch: [() => branchStore.activeBranchId]
})

const { data: servicesData } = await useAsyncData('history-services', async () => {
  const branchId = branchStore.activeBranchId || undefined
  const response = await kioskApi.services({ active: true, grouped: true, ...(branchId ? { branch_id: branchId } : {}) })
  return flattenServicesPayload(response)
}, {
  watch: [() => branchStore.activeBranchId]
})

const historyItems = computed<HistoryItem[]>(() => data.value || [])

const filteredHistory = computed(() =>
  historyItems.value.filter(item =>
    branchStore.activeBranchId
      ? String(item.branch_id || (item as any).branch?.id || '') === String(branchStore.activeBranchId)
      : true
  )
)

const rows = computed(() =>
  filteredHistory.value.map((item) => ({
    ...item,
    client: getClientName(item) || 'Клиент',
    phone: getClientPhone(item) || 'Не указан',
    created_at: item.created_at || (item as any).createdAt || '',
    amount: item.amount
      ?? (item as any).order_total
      ?? (item as any).orderTotal
      ?? (item as any).price_override
      ?? (item as any).price
      ?? null
  }))
)

const paginatedHistory = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return rows.value.slice(start, start + itemsPerPage)
})

const pageFrom = computed(() =>
  rows.value.length ? (page.value - 1) * itemsPerPage + 1 : 0
)

const pageTo = computed(() =>
  rows.value.length
    ? Math.min(page.value * itemsPerPage, rows.value.length)
    : 0
)

watch(
  () => branchStore.activeBranchId,
  () => {
    page.value = 1
  }
)

watch(
  () => rows.value.length,
  (length) => {
    const maxPage = Math.max(1, Math.ceil(length / itemsPerPage))

    if (page.value > maxPage) {
      page.value = maxPage
    }
  }
)

const detailModalOpen = ref(false)
const selectedEntry = ref<any | null>(null)

function openDetails(row: any) {
  selectedEntry.value = row
  detailModalOpen.value = true
}

async function exportHistoryToExcel() {
  if (!import.meta.client) {
    return
  }

  if (!rows.value.length) {
    useApiClient().notifyError(new Error('Нет данных для экспорта'))
    return
  }

  exporting.value = true

  try {
    const delimiter = ';'
    const branchNameMap = new Map(branchStore.branches.map(branch => [String(branch.id), branch.name]))

    const exportRows: string[][] = [
      ['ID', 'Филиал', 'Клиент', 'Телефон', 'Статус', 'Оплата', 'Сумма', 'Создано', 'Услуги']
    ]

    for (const entry of rows.value) {
      const branchId = normalizeText((entry as any).branch_id || (entry as any).branch?.id)
      const branchName = branchId ? branchNameMap.get(String(branchId)) || String(branchId) : ''

      exportRows.push([
        String((entry as any).id || ''),
        branchName,
        getClientName(entry) || '',
        getClientPhone(entry) || '',
        normalizeText((entry as any).status) || '',
        formatPaymentMethod((entry as any).payment_method),
        (entry as any).amount == null ? '' : String((entry as any).amount),
        formatDateTime((entry as any).created_at),
        getServiceNames(entry).join(', ')
      ])
    }

    const csv = exportRows
      .map(row => row.map(cell => escapeCsvCell(cell, delimiter)).join(delimiter))
      .join('\r\n')

    const activeBranchName = branchStore.activeBranch?.name
    const branchSegment = sanitizeFilenameSegment(activeBranchName ? activeBranchName : 'all-branches')
    const filename = `history_${branchSegment}_${formatExportTimestamp(new Date())}.csv`

    downloadTextFile(filename, `\uFEFF${csv}`, 'text/csv;charset=utf-8')
    useApiClient().notifySuccess('Экспорт готов')
  }
  finally {
    exporting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="history-global">
    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4">
        <UBadge color="neutral" variant="soft">
          {{ branchStore.activeBranch?.name || 'Общее по всем филиалам' }}
        </UBadge>
        <div class="flex items-center gap-2">
          <UBadge color="neutral" variant="outline">
            {{ historyItems.length }} записей
          </UBadge>
          <UButton
            color="neutral"
            icon="i-lucide-file-spreadsheet"
            :loading="exporting"
            :disabled="!rows.length"
            variant="outline"
            @click="exportHistoryToExcel"
          >
            Экспорт в Excel
          </UButton>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
        </div>
      </div>

      <div v-if="rows.length" class="flex flex-col max-h-[70vh] overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
        <div class="flex-1 overflow-auto">
          <UTable :columns="columns" :data="paginatedHistory" :loading="pending" sticky="header" :ui="{
            root: 'w-full overflow-auto',
            base: 'w-full min-w-[64rem]',
            thead: 'bg-charcoal-50/90',
            tbody: 'divide-y divide-charcoal-100',
            th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
            td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
          }">
            <template #client-cell="{ row }">
              <span class="font-semibold text-charcoal-950">{{ row.original.client }}</span>
            </template>

            <template #phone-cell="{ row }">
              <span class="text-sm text-charcoal-700">{{ row.original.phone }}</span>
            </template>

            <template #status-cell="{ row }">
              <SharedStatusBadge :label="row.original.status" />
            </template>

            <template #payment_method-cell="{ row }">
              {{ formatPaymentMethod(row.original.payment_method) }}
            </template>

            <template #amount-cell="{ row }">
              {{ formatMoney(row.original.amount) }}
            </template>

            <template #created_at-cell="{ row }">
              {{ formatDateTime(row.original.created_at) }}
            </template>

            <template #actions-cell="{ row }">
              <UButton
                color="neutral"
                size="xs"
                variant="outline"
                icon="i-lucide-eye"
                @click="openDetails(row.original)"
              >
                Подробнее
              </UButton>
            </template>
          </UTable>
        </div>

        <div class="flex flex-col gap-3 border-t border-charcoal-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-charcoal-500">
            Показано {{ pageFrom }}-{{ pageTo }} из {{ rows.length }}
          </p>

          <UPagination v-model:page="page"
            :items-per-page="itemsPerPage"
            :show-controls="true"
            :sibling-count="1"
            :total="rows.length"
            size="sm"
          />
        </div>
      </div>

      <div v-else class="rounded-[1.25rem] border border-dashed border-charcoal-200 bg-white/70 px-5 py-6 text-sm text-charcoal-500">
        Для выбранного филиала записи отсутствуют.
      </div>

      <UModal v-model:open="detailModalOpen" title="Детали визита">
        <template #body>
          <div v-if="selectedEntry" class="space-y-3">
            <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
              <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Клиент</p>
              <p class="text-lg font-semibold text-charcoal-950">{{ getClientName(selectedEntry) || 'Клиент' }}</p>
              <p class="text-sm text-charcoal-600">{{ getClientPhone(selectedEntry) || 'Телефон не указан' }}</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Статус</p>
                <p class="text-sm font-semibold text-charcoal-950">{{ selectedEntry.status || '—' }}</p>
              </div>
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Оплата</p>
                <p class="text-sm font-semibold text-charcoal-950">{{ formatPaymentMethod(selectedEntry.payment_method) }}</p>
              </div>
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Сумма</p>
                <p class="text-sm font-semibold text-charcoal-950">{{ formatMoney(selectedEntry.amount) }}</p>
              </div>
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Создано</p>
                <p class="text-sm font-semibold text-charcoal-950">{{ formatDateTime(selectedEntry.created_at) }}</p>
              </div>
            </div>

            <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
              <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500 mb-2">Услуги</p>
              <div v-if="getServiceNames(selectedEntry).length" class="text-sm text-charcoal-700 space-y-1">
                <div v-for="(svc, i) in getServiceNames(selectedEntry)" :key="`svc-${i}`">
                  • {{ svc }}
                </div>
              </div>
              <p v-else class="text-sm text-charcoal-700">Не указаны</p>
            </div>
          </div>
          <SharedEmptyState
            v-else
            description="Не удалось загрузить данные визита."
            icon="i-lucide-notebook-pen"
            title="Нет данных"
          />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
