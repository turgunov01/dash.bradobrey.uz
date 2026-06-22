<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { HistoryItem } from '~~/shared/schemas'
import { formatDateTime, formatMoney } from '~/utils/format'
import { formatPaymentMethod } from '~/utils/display'
import { flattenServicesPayload } from '~/utils/services'

type BarberDirectoryItem = Record<string, any>

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

function extractBarberItems(response: unknown): BarberDirectoryItem[] {
  if (Array.isArray(response)) {
    return response as BarberDirectoryItem[]
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    barbers?: BarberDirectoryItem[]
    data?: BarberDirectoryItem[] | { items?: BarberDirectoryItem[], barbers?: BarberDirectoryItem[] }
    items?: BarberDirectoryItem[]
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.barbers)) {
    return payload.barbers
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.data?.items)) {
    return payload.data.items
  }

  if (Array.isArray(payload.data?.barbers)) {
    return payload.data.barbers
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

function toNumberOrNull(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const amount = Number(value)

  return Number.isFinite(amount) ? amount : null
}

function getPaymentBreakdown(item: Record<string, any>) {
  const payments = Array.isArray(item.payments) ? item.payments : []
  const amountsByMethod = new Map<string, number>()

  for (const payment of payments) {
    const method = normalizeText(payment?.method)
    const amount = toNumberOrNull(payment?.amount)

    if (!method || amount === null || amount <= 0) {
      continue
    }

    amountsByMethod.set(method, (amountsByMethod.get(method) || 0) + amount)
  }

  return Array.from(amountsByMethod.entries()).map(([method, amount]) => ({
    amount,
    method
  }))
}

function isMixedPayment(item: Record<string, any>) {
  return normalizeText(item.payment_method)?.toLowerCase() === 'mixed'
    || getPaymentBreakdown(item).length > 1
}

function getOriginalAmount(item: Record<string, any>) {
  return toNumberOrNull(
    item.original_amount
    ?? item.originalAmount
    ?? item.order_total
    ?? item.orderTotal
  )
}

function getAdjustmentReason(item: Record<string, any>) {
  return normalizeText(
    item.price_override_reason
    || item.priceOverrideReason
    || item.override_reason
  )
}

function isPriceAdjusted(item: Record<string, any>) {
  const amountSource = normalizeText(item.amount_source || item.amountSource)
  const override = toNumberOrNull(item.price_override ?? item.priceOverride)

  return amountSource === 'price_override' || (override !== null && override > 0)
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

function shortId(value: string) {
  return value.length > 8 ? value.slice(0, 8) : value
}

function pickTextValue(source: Record<string, any> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const rawValue = source?.[key]

    if (rawValue && typeof rawValue === 'object') {
      continue
    }

    const value = normalizeText(rawValue)

    if (value) {
      return value
    }
  }

  return null
}

function pickRecordValue(source: Record<string, any> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = source?.[key]

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, any>
    }
  }

  return null
}

function getRecordDisplayName(record: Record<string, any> | null | undefined) {
  if (!record) {
    return null
  }

  return pickTextValue(record, ['name', 'full_name', 'title', 'login', 'phone'])
    || pickTextValue(record.user, ['name', 'login', 'phone'])
}

function getRecordId(record: Record<string, any> | null | undefined) {
  return pickTextValue(record, ['id', 'user_id', 'userId'])
}

function getRecordDisplayNameForId(record: Record<string, any> | null | undefined, expectedId: string | null) {
  const recordId = getRecordId(record)

  if (expectedId && recordId && recordId !== expectedId) {
    return null
  }

  return getRecordDisplayName(record)
}

function getVisitBranchId(visit: Record<string, any>) {
  return pickTextValue(visit, ['branch_id', 'branchId'])
    || pickTextValue(pickRecordValue(visit, ['branch', 'branches']), ['id'])
}

function getVisitBranchName(visit: Record<string, any>) {
  const branchId = getVisitBranchId(visit)

  return pickTextValue(visit, ['branch_name', 'branchName'])
    || getRecordDisplayName(pickRecordValue(visit, ['branch', 'branches']))
    || (branchId ? branchNameMap.value.get(branchId) || `Филиал ${shortId(branchId)}` : 'Филиал не указан')
}

const selectedBarberRecordKeys = [
  'selected_barber',
  'selectedBarber',
  'requested_barber',
  'requestedBarber',
  'assigned_barber',
  'assignedBarber',
  'initial_barber',
  'initialBarber',
  'original_barber',
  'originalBarber',
  'barber'
]

const selectedBarberIdKeys = [
  'selected_barber_id',
  'selectedBarberId',
  'requested_barber_id',
  'requestedBarberId',
  'assigned_barber_id',
  'assignedBarberId',
  'initial_barber_id',
  'initialBarberId',
  'original_barber_id',
  'originalBarberId',
  'barber_id',
  'barberId'
]

const executingBarberRecordKeys = [
  'executing_barber',
  'executingBarber',
  'actual_barber',
  'actualBarber',
  'performer_barber',
  'performerBarber',
  'serving_barber',
  'servingBarber',
  'completed_by_barber',
  'completedByBarber',
  'performed_by',
  'performedBy',
  'barber'
]

const executingBarberIdKeys = [
  'executing_barber_id',
  'executingBarberId',
  'actual_barber_id',
  'actualBarberId',
  'performer_barber_id',
  'performerBarberId',
  'serving_barber_id',
  'servingBarberId',
  'completed_by_barber_id',
  'completedByBarberId',
  'performed_by_barber_id',
  'performedByBarberId',
  'performed_by',
  'performedBy',
  'barber_id',
  'barberId'
]

function getVisitSelectedBarberId(visit: Record<string, any>) {
  return pickTextValue(visit, selectedBarberIdKeys)
    || pickTextValue(pickRecordValue(visit, selectedBarberRecordKeys), ['id', 'user_id', 'userId'])
}

function getVisitExecutingBarberId(visit: Record<string, any>) {
  return pickTextValue(visit, executingBarberIdKeys)
    || pickTextValue(pickRecordValue(visit, executingBarberRecordKeys), ['id', 'user_id', 'userId'])
    || getVisitSelectedBarberId(visit)
}

function getVisitSelectedBarberName(visit: Record<string, any>) {
  const barberId = getVisitSelectedBarberId(visit)

  return getRecordDisplayNameForId(pickRecordValue(visit, selectedBarberRecordKeys), barberId)
    || (barberId ? barberNameMap.value.get(barberId) || `Барбер ${shortId(barberId)}` : 'Барбер не указан')
}

function getVisitExecutingBarberName(visit: Record<string, any>) {
  const barberId = getVisitExecutingBarberId(visit)

  return getRecordDisplayNameForId(pickRecordValue(visit, executingBarberRecordKeys), barberId)
    || (barberId ? barberNameMap.value.get(barberId) || `Барбер ${shortId(barberId)}` : 'Барбер не указан')
}

function toBooleanOrNull(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1 ? true : value === 0 ? false : null
  }

  const text = normalizeText(value)?.toLowerCase()

  if (!text) {
    return null
  }

  if (['1', 'true', 'yes', 'y', 'да'].includes(text)) {
    return true
  }

  if (['0', 'false', 'no', 'n', 'нет'].includes(text)) {
    return false
  }

  return null
}

function hasBarberSwap(visit: Record<string, any>) {
  const explicit = toBooleanOrNull(
    visit.swapped_flag
    ?? visit.swappedFlag
    ?? visit.barber_swapped
    ?? visit.barberSwapped
    ?? visit.barber_changed
    ?? visit.barberChanged
    ?? visit.has_barber_change
    ?? visit.hasBarberChange
  )

  if (explicit !== null) {
    return explicit
  }

  const selectedBarberId = getVisitSelectedBarberId(visit)
  const executingBarberId = getVisitExecutingBarberId(visit)

  return Boolean(selectedBarberId && executingBarberId && selectedBarberId !== executingBarberId)
}

function toDateKey(value: unknown) {
  const text = normalizeText(value)

  if (!text) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10)
  }

  const date = new Date(text)

  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

function getVisitDateKey(visit: Record<string, any>) {
  return toDateKey(
    visit.created_at
    || visit.createdAt
    || visit.completed_at
    || visit.completedAt
    || visit.finished_at
    || visit.finishedAt
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
const apiClient = useApiClient()

const page = ref(1)
const itemsPerPage = 10
const exporting = ref(false)
const allBarbersValue = '__all_barbers__'
const selectedBarberId = ref(allBarbersValue)
const dateFrom = ref('')
const dateTo = ref('')

await branchStore.ensureLoaded()

const columns: TableColumn<any>[] = [
  { accessorKey: 'client', header: 'КЛИЕНТ' },
  { accessorKey: 'phone', header: 'ТЕЛЕФОН' },
  { accessorKey: 'barber', header: 'БАРБЕР' },
  { accessorKey: 'status', header: 'СТАТУС' },
  { accessorKey: 'payment_method', header: 'ОПЛАТА' },
  { accessorKey: 'amount', header: 'СУММА' },
  { accessorKey: 'created_at', header: 'СОЗДАНО' },
  { id: 'actions', header: '' }
]

const historyDateRange = computed(() => {
  const from = dateFrom.value || ''
  const to = dateTo.value || ''

  if (from && to && from > to) {
    return {
      end: from,
      start: to
    }
  }

  return {
    end: to,
    start: from
  }
})

const historyQuery = computed(() => {
  const query: Record<string, string> = {}
  const range = historyDateRange.value

  if (branchStore.activeBranchId) {
    query.branch_id = branchStore.activeBranchId
  }

  if (range.start) {
    query.from = range.start
    query.start_date = range.start
  }

  if (range.end) {
    query.to = range.end
    query.end_date = range.end
  }

  return query
})

const hasActiveFilters = computed(() =>
  Boolean(selectedBarberId.value !== allBarbersValue || dateFrom.value || dateTo.value)
)

const { data, pending, refresh } = await useAsyncData('history-current-filter', async () => {
  const response = await historyApi.list(historyQuery.value)

  return extractHistoryItems(response)
}, {
  server: false,
  watch: [() => branchStore.activeBranchId, dateFrom, dateTo]
})

const { data: servicesData } = await useAsyncData('history-services', async () => {
  const branchId = branchStore.activeBranchId || undefined
  const response = await kioskApi.services({ active: true, grouped: true, ...(branchId ? { branch_id: branchId } : {}) })
  return flattenServicesPayload(response)
}, {
  watch: [() => branchStore.activeBranchId]
})

const { data: barbersData } = await useAsyncData('history-barbers-directory', async () => {
  const branchId = branchStore.activeBranchId || undefined

  try {
    return await apiClient.request<{ items?: BarberDirectoryItem[] }>('/api/barbers', {
      query: {
        __skipBranchScope: true,
        mode: 'employees',
        ...(branchId ? { branch_id: branchId } : {})
      },
      silent: true
    })
  }
  catch {
    return { items: [] }
  }
}, {
  server: false,
  watch: [() => branchStore.activeBranchId]
})

const branchNameMap = computed(() =>
  new Map(branchStore.branches.map(branch => [String(branch.id), branch.name]))
)

const barberNameMap = computed(() => {
  const map = new Map<string, string>()

  for (const item of extractBarberItems(barbersData.value)) {
    const id = pickTextValue(item, ['id', 'user_id', 'userId'])
    const name = getRecordDisplayName(item)

    if (id && name) {
      map.set(id, name)
    }
  }

  return map
})

const historyItems = computed<HistoryItem[]>(() => data.value || [])

const barberFilterOptions = computed(() => {
  const options = new Map<string, string>()

  for (const item of extractBarberItems(barbersData.value)) {
    const id = pickTextValue(item, ['id', 'user_id', 'userId'])
    const name = getRecordDisplayName(item)

    if (id) {
      options.set(id, name || `Барбер ${shortId(id)}`)
    }
  }

  for (const item of historyItems.value) {
    const visit = item as Record<string, any>

    for (const id of [getVisitSelectedBarberId(visit), getVisitExecutingBarberId(visit)]) {
      if (id && !options.has(id)) {
        options.set(id, barberNameMap.value.get(id) || `Барбер ${shortId(id)}`)
      }
    }
  }

  return [
    { label: 'Все барберы', value: allBarbersValue },
    ...[...options.entries()]
      .map(([value, label]) => ({ label, value }))
      .sort((left, right) => left.label.localeCompare(right.label, 'ru'))
  ]
})

function isVisitInSelectedDateRange(visit: Record<string, any>) {
  const range = historyDateRange.value

  if (!range.start && !range.end) {
    return true
  }

  const dateKey = getVisitDateKey(visit)

  if (!dateKey) {
    return false
  }

  return (!range.start || dateKey >= range.start)
    && (!range.end || dateKey <= range.end)
}

function isVisitBySelectedBarber(visit: Record<string, any>) {
  if (selectedBarberId.value === allBarbersValue) {
    return true
  }

  return [
    getVisitSelectedBarberId(visit),
    getVisitExecutingBarberId(visit)
  ].includes(selectedBarberId.value)
}

const filteredHistory = computed(() =>
  historyItems.value.filter((item) => {
    const visit = item as Record<string, any>
    const branchMatches = branchStore.activeBranchId
      ? String(visit.branch_id || visit.branch?.id || '') === String(branchStore.activeBranchId)
      : true

    return branchMatches
      && isVisitBySelectedBarber(visit)
      && isVisitInSelectedDateRange(visit)
  })
)

const rows = computed(() =>
  filteredHistory.value.map((item) => ({
    ...item,
    client: getClientName(item) || 'Клиент',
    phone: getClientPhone(item) || 'Не указан',
    barber: getVisitExecutingBarberName(item),
    created_at: item.created_at || (item as any).createdAt || '',
    amount: item.amount
      ?? (item as any).order_total
      ?? (item as any).orderTotal
      ?? (item as any).price_override
      ?? (item as any).price
      ?? null,
    amount_source: (item as any).amount_source || (item as any).amountSource || null,
    original_amount: (item as any).original_amount ?? (item as any).originalAmount ?? null,
    price_override: (item as any).price_override ?? (item as any).priceOverride ?? null,
    price_override_reason: (item as any).price_override_reason ?? (item as any).priceOverrideReason ?? null
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
  [() => branchStore.activeBranchId, selectedBarberId, dateFrom, dateTo],
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

function resetHistoryFilters() {
  selectedBarberId.value = allBarbersValue
  dateFrom.value = ''
  dateTo.value = ''
}

function openDetails(row: any) {
  selectedEntry.value = row
  detailModalOpen.value = true
}

async function exportHistoryToExcel() {
  if (!import.meta.client) {
    return
  }

  if (!rows.value.length) {
    apiClient.notifyError(new Error('Нет данных для экспорта'))
    return
  }

  exporting.value = true

  try {
    const delimiter = ';'
    const branchNameMap = new Map(branchStore.branches.map(branch => [String(branch.id), branch.name]))

    const exportRows: string[][] = [
      ['ID', 'Филиал', 'Клиент', 'Телефон', 'Барбер', 'Статус', 'Оплата', 'Сумма', 'Оригинальная сумма', 'Причина изменения', 'Создано', 'Услуги']
    ]

    for (const entry of rows.value) {
      const branchId = normalizeText((entry as any).branch_id || (entry as any).branch?.id)
      const branchName = branchId ? branchNameMap.get(String(branchId)) || String(branchId) : ''

      exportRows.push([
        String((entry as any).id || ''),
        branchName,
        getClientName(entry) || '',
        getClientPhone(entry) || '',
        getVisitExecutingBarberName(entry),
        normalizeText((entry as any).status) || '',
        formatPaymentMethod((entry as any).payment_method),
        (entry as any).amount == null ? '' : String((entry as any).amount),
        getOriginalAmount(entry) == null ? '' : String(getOriginalAmount(entry)),
        getAdjustmentReason(entry) || '',
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
    apiClient.notifySuccess('Экспорт готов')
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
            {{ rows.length }} записей
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

      <div class="mb-4 grid gap-3 rounded-[1.25rem] border border-charcoal-200 bg-white/85 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] md:items-end">
        <UFormField label="Барбер">
          <USelect
            v-model="selectedBarberId"
            class="w-full"
            :items="barberFilterOptions"
            value-key="value"
          />
        </UFormField>

        <UFormField label="От">
          <UInput v-model="dateFrom" type="date" />
        </UFormField>

        <UFormField label="До">
          <UInput v-model="dateTo" type="date" />
        </UFormField>

        <UButton
          color="neutral"
          icon="i-lucide-rotate-ccw"
          :disabled="!hasActiveFilters"
          variant="outline"
          @click="resetHistoryFilters"
        >
          Сбросить
        </UButton>
      </div>

      <div v-if="rows.length" class="flex flex-col max-h-[70vh] overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
        <div class="flex-1 overflow-auto">
          <UTable :columns="columns" :data="paginatedHistory" :loading="pending" sticky="header" :ui="{
            root: 'w-full overflow-auto',
            base: 'w-full min-w-[72rem]',
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

            <template #barber-cell="{ row }">
              <span class="font-medium text-charcoal-950">{{ row.original.barber }}</span>
            </template>

            <template #status-cell="{ row }">
              <SharedStatusBadge :label="row.original.status" />
            </template>

            <template #payment_method-cell="{ row }">
              {{ formatPaymentMethod(row.original.payment_method) }}
            </template>

            <template #amount-cell="{ row }">
              <div class="space-y-1">
                <p class="font-semibold text-charcoal-950">
                  {{ formatMoney(row.original.amount) }}
                </p>
                <p v-if="isPriceAdjusted(row.original)" class="text-xs text-amber-700">
                  Изменено<span v-if="getOriginalAmount(row.original) !== null"> с {{ formatMoney(getOriginalAmount(row.original)) }}</span>
                </p>
              </div>
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
        По выбранным фильтрам записи отсутствуют.
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
                <div v-if="isMixedPayment(selectedEntry) && getPaymentBreakdown(selectedEntry).length" class="mt-2 space-y-1 text-xs text-charcoal-600">
                  <div
                    v-for="part in getPaymentBreakdown(selectedEntry)"
                    :key="part.method"
                    class="flex items-center justify-between gap-3"
                  >
                    <span>{{ formatPaymentMethod(part.method) }}</span>
                    <span class="font-semibold text-charcoal-950">{{ formatMoney(part.amount) }}</span>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Сумма</p>
                <p class="text-sm font-semibold text-charcoal-950">{{ formatMoney(selectedEntry.amount) }}</p>
                <div v-if="isPriceAdjusted(selectedEntry)" class="mt-2 space-y-1 text-xs text-charcoal-600">
                  <p v-if="getOriginalAmount(selectedEntry) !== null">
                    Оригинальная сумма: {{ formatMoney(getOriginalAmount(selectedEntry)) }}
                  </p>
                  <p v-if="getAdjustmentReason(selectedEntry)">
                    Причина: {{ getAdjustmentReason(selectedEntry) }}
                  </p>
                </div>
              </div>
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Создано</p>
                <p class="text-sm font-semibold text-charcoal-950">{{ formatDateTime(selectedEntry.created_at) }}</p>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Филиал</p>
                <p class="text-sm font-semibold text-charcoal-950">{{ getVisitBranchName(selectedEntry) }}</p>
              </div>
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Выбранный барбер</p>
                <p class="text-sm font-semibold text-charcoal-950">{{ getVisitSelectedBarberName(selectedEntry) }}</p>
              </div>
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Исполняющий барбер</p>
                <p class="text-sm font-semibold text-charcoal-950">{{ getVisitExecutingBarberName(selectedEntry) }}</p>
              </div>
              <div class="flex items-center justify-between gap-3 rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <span class="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-500">Смена барбера</span>
                <UBadge :color="hasBarberSwap(selectedEntry) ? 'warning' : 'neutral'" variant="soft">
                  {{ hasBarberSwap(selectedEntry) ? 'Да' : 'Нет' }}
                </UBadge>
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
