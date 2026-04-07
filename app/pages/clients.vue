<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { formatCount, formatDateTime, formatMoney, formatPercent } from '~/utils/format'
import { flattenServicesPayload } from '~/utils/services'

type ClientRow = {
  phone: string
  name: string
  visits: number
  firstSeen: string | null
  lastSeen: string | null
}

function extractHistoryItems(response: unknown): Record<string, any>[] {
  if (Array.isArray(response)) {
    return response as Record<string, any>[]
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as {
    data?: Record<string, any>[] | { items?: Record<string, any>[] }
    items?: Record<string, any>[]
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

function normalizeTimestamp(value: string | null | undefined) {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    return null
  }

  const date = new Date(normalizedValue)

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function isCompletedStatus(status: string) {
  return ['completed', 'done', 'paid'].includes(String(status || '').toLowerCase())
}

function isCancelledStatus(status: string) {
  return ['cancelled', 'no_show', 'not_in_time'].includes(String(status || '').toLowerCase())
}

function getVisitAmount(item: Record<string, any>) {
  const amountFields = [
    item.amount,
    item.order_total,
    item.total_amount,
    item.price_override,
    item.price
  ]

  for (const value of amountFields) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    const num = Number(value)
    if (Number.isFinite(num)) {
      return num
    }
  }

  return null
}

const uiStore = useUiStore()
const historyApi = useHistoryApi()
const branchStore = useBranchStore()
const kioskApi = useKioskApi()

await branchStore.ensureLoaded()

const columns: TableColumn<ClientRow>[] = [
  { accessorKey: 'phone', header: 'Телефон' },
  { accessorKey: 'name', header: 'Имя' },
  { accessorKey: 'visits', header: 'Визиты' },
  { accessorKey: 'firstSeen', header: 'Первый визит' },
  { accessorKey: 'lastSeen', header: 'Последний визит' },
  { id: 'actions', header: '' }
]

const page = ref(1)
const pageSize = 10
const detailModalOpen = ref(false)
const selectedPhone = ref('')
const searchPhone = ref('')
const minVisits = ref<number | null>(null)
const serviceFilter = ref('')

const { data, pending, refresh } = await useAsyncData('clients-directory', async () => {
  const query = {
    end_date: uiStore.statisticsRange.end,
    start_date: uiStore.statisticsRange.start
  }

  const response = branchStore.activeBranchId
    ? await historyApi.branch(branchStore.activeBranchId, query)
    : await historyApi.list(query)

  return { items: extractHistoryItems(response) }
}, {
  watch: [() => uiStore.statisticsRange.start, () => uiStore.statisticsRange.end, () => branchStore.activeBranchId]
})

const { data: servicesData } = await useAsyncData('clients-services', async () => {
  const branchId = branchStore.activeBranchId || undefined
  const response = await kioskApi.services({ active: true, grouped: true, ...(branchId ? { branch_id: branchId } : {}) })
  return flattenServicesPayload(response)
}, {
  watch: [() => branchStore.activeBranchId]
})

const clientRows = computed<ClientRow[]>(() => {
  const map = new Map<string, ClientRow & { firstTs: number | null, lastTs: number | null }>()

  for (const item of (data.value?.items || [])) {
    const phone = getClientPhone(item)
    if (!phone) continue

    const name = getClientName(item) || 'Клиент'
    const createdAt = normalizeTimestamp(item.created_at) || normalizeTimestamp(item.createdAt)
    const ts = createdAt ? new Date(createdAt).getTime() : null

    const current = map.get(phone) || {
      phone,
      name,
      visits: 0,
      firstSeen: null,
      lastSeen: null,
      firstTs: null,
      lastTs: null
    }

    current.visits += 1

    if (ts !== null) {
      if (current.firstTs === null || ts < current.firstTs) {
        current.firstTs = ts
        current.firstSeen = new Date(ts).toISOString()
      }
      if (current.lastTs === null || ts > current.lastTs) {
        current.lastTs = ts
        current.lastSeen = new Date(ts).toISOString()
      }
    }

    map.set(phone, current)
  }

  return [...map.values()]
    .sort((a, b) => b.visits - a.visits || (b.lastTs || 0) - (a.lastTs || 0))
})

const visitsByPhone = computed(() => {
  const grouped = new Map<string, Array<Record<string, any>>>()

  for (const item of (data.value?.items || [])) {
    const phone = getClientPhone(item)
    if (!phone) continue
    const list = grouped.get(phone) || []
    list.push(item)
    grouped.set(phone, list)
  }

  for (const [phone, list] of grouped.entries()) {
    list.sort((a, b) => {
      const tsA = normalizeTimestamp(a.created_at) || normalizeTimestamp(a.createdAt)
      const tsB = normalizeTimestamp(b.created_at) || normalizeTimestamp(b.createdAt)
      return (tsB ? new Date(tsB).getTime() : 0) - (tsA ? new Date(tsA).getTime() : 0)
    })
  }

  return grouped
})

const filteredClientRows = computed<ClientRow[]>(() => {
  const phoneNeedle = searchPhone.value.trim()
  const selectedService = serviceFilter.value.trim()
  const min = minVisits.value ?? null

  return clientRows.value.filter((row) => {
    const matchesPhone = !phoneNeedle || row.phone.includes(phoneNeedle)
    const matchesVisits = min === null || row.visits >= min

    if (selectedService) {
      const visits = visitsByPhone.value.get(row.phone) || []
      const hasService = visits.some(v => getVisitServiceIds(v).includes(selectedService))
      return matchesPhone && matchesVisits && hasService
    }

    return matchesPhone && matchesVisits
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredClientRows.value.length / pageSize)))
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredClientRows.value.slice(start, start + pageSize)
})

watch([filteredClientRows, page], () => {
  if (page.value > pageCount.value) {
    page.value = pageCount.value
  }
})

watch(
  () => [branchStore.activeBranchId, uiStore.statisticsRange.start, uiStore.statisticsRange.end],
  () => {
    page.value = 1
  }
)

function openClientDetails(phone: string) {
  selectedPhone.value = phone
  detailModalOpen.value = true
}

const selectedVisits = computed(() =>
  visitsByPhone.value.get(selectedPhone.value) || []
)

const selectedSummary = computed(() => {
  const visits = selectedVisits.value
  const total = visits.length
  const completed = visits.filter(v => isCompletedStatus(v.status)).length
  const cancelled = visits.filter(v => isCancelledStatus(v.status)).length
  const spend = visits.reduce((sum, v) => {
    const amount = getVisitAmount(v)
    return sum + (amount ?? 0)
  }, 0)

  return {
    total,
    completed,
    cancelled,
    completionRate: total ? (completed / total) * 100 : 0,
    spend
  }
})

const serviceNameMap = computed(() =>
  new Map(
    (servicesData.value || []).map((svc: any) => [String(svc.id), svc.name || `Услуга ${svc.id}`])
  )
)
const serviceOptions = computed(() => [
  { label: 'Все услуги', value: '' },
  ...(servicesData.value || []).map((svc: any) => ({
    label: svc.name || `Услуга ${svc.id}`,
    value: String(svc.id)
  }))
])

function getVisitServices(visit: Record<string, any>) {
  const ids = Array.isArray(visit.service_ids)
    ? visit.service_ids
    : visit.service_id
      ? [visit.service_id]
      : []

  return ids
    .map((id: any) => {
      const key = String(id)
      return serviceNameMap.value.get(key) || key
    })
    .filter(Boolean)
}

function getVisitServiceIds(visit: Record<string, any>) {
  const ids = Array.isArray(visit.service_ids)
    ? visit.service_ids
    : visit.service_id
      ? [visit.service_id]
      : []

  return ids.map((id: any) => String(id))
}
</script>

<template>
  <UDashboardPanel id="clients">
    <template #body>
      <div class="flex items-center justify-between pb-4">
        <div class="flex items-center gap-3">
          <UBadge color="neutral" size="lg" variant="soft">
            {{ formatCount(filteredClientRows.length) }} клиентов
          </UBadge>
        </div>
        <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
          Обновить
        </UButton>
      </div>

      <div class="grid gap-3 pb-4 md:grid-cols-3">
        <UInput
          v-model="searchPhone"
          icon="i-lucide-search"
          placeholder="Телефон"
        />
        <UInput
          v-model.number="minVisits"
          type="number"
          min="0"
          placeholder="Мин. визитов"
        />
        <USelect
          v-model="serviceFilter"
          :options="serviceOptions"
          option-attribute="label"
          value-attribute="value"
          placeholder="Все услуги"
          clearable
        />
      </div>

      <div class="flex flex-col max-h-[70vh] overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
        <div class="flex-1 overflow-auto">
          <UTable
            :columns="columns"
            :data="pagedRows"
            :loading="pending"
            sticky="header"
            :ui="{
              root: 'w-full overflow-auto',
              base: 'w-full min-w-[64rem]',
              thead: 'bg-charcoal-50/90',
              tbody: 'divide-y divide-charcoal-100',
              th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
              td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
            }"
          >
            <template #phone-cell="{ row }">
              <span class="font-semibold text-charcoal-950">{{ row.original.phone }}</span>
            </template>
            <template #name-cell="{ row }">
              <span class="text-charcoal-700">{{ row.original.name }}</span>
            </template>
            <template #visits-cell="{ row }">
              <span class="font-semibold text-charcoal-950">{{ formatCount(row.original.visits) }}</span>
            </template>
            <template #firstSeen-cell="{ row }">
              <span class="text-charcoal-600">
                {{ row.original.firstSeen ? formatDateTime(row.original.firstSeen) : '—' }}
              </span>
            </template>
            <template #lastSeen-cell="{ row }">
              <span class="text-charcoal-600">
                {{ row.original.lastSeen ? formatDateTime(row.original.lastSeen) : '—' }}
              </span>
            </template>
            <template #actions-cell="{ row }">
              <UButton
                color="neutral"
                size="xs"
                variant="outline"
                icon="i-lucide-eye"
                @click="openClientDetails(row.original.phone)"
              >
                Подробнее
              </UButton>
            </template>
          </UTable>
        </div>
        <div class="flex items-center justify-end gap-3 border-t border-charcoal-100 px-4 py-3">
          <span class="text-xs text-charcoal-500">
            Показано {{ pagedRows.length ? (page - 1) * pageSize + 1 : 0 }}–{{ Math.min(page * pageSize, clientRows.length) }} из {{ clientRows.length }}
          </span>
          <UPagination
            v-model:page="page"
            :page-count="pageCount"
            :total="clientRows.length"
            :per-page="pageSize"
            size="sm"
          />
        </div>
      </div>

      <SharedEmptyState
        v-if="!clientRows.length"
        description="За выбранный период не найдено клиентов."
        icon="i-lucide-users-round"
        title="Нет данных"
      />

      <UModal v-model:open="detailModalOpen" title="История клиента" description="Все визиты и услуги по выбранному номеру">
        <template #body>
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-3 rounded-xl bg-sand-50 px-4 py-3">
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Телефон</p>
                <p class="text-lg font-semibold text-charcoal-950">{{ selectedPhone || '—' }}</p>
              </div>
              <UBadge color="neutral" variant="outline">
                {{ selectedVisits.length }} визитов
              </UBadge>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Визиты</p>
                <p class="text-lg font-semibold text-charcoal-950">{{ formatCount(selectedSummary.total) }}</p>
              </div>
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Завершено</p>
                <p class="text-lg font-semibold text-emerald-600">{{ formatCount(selectedSummary.completed) }}</p>
              </div>
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Отказы</p>
                <p class="text-lg font-semibold text-amber-600">{{ formatCount(selectedSummary.cancelled) }}</p>
              </div>
              <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Completion</p>
                <p class="text-lg font-semibold text-charcoal-950">{{ formatPercent(selectedSummary.completionRate) }}</p>
              </div>
            </div>

            <div class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3">
              <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Сумма оплат</p>
              <p class="text-lg font-semibold text-charcoal-950">{{ formatMoney(selectedSummary.spend) }}</p>
            </div>

            <div v-if="selectedVisits.length" class="max-h-[60vh] space-y-2 overflow-auto pr-1">
              <div
                v-for="(visit, index) in selectedVisits"
                :key="visit.id || index"
                class="rounded-xl border border-charcoal-200 bg-white/90 px-4 py-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="space-y-1">
                    <p class="text-sm font-semibold text-charcoal-950">
                      {{ getClientName(visit) || 'Клиент' }}
                    </p>
                    <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">
                      {{ formatDateTime(normalizeTimestamp(visit.created_at) || normalizeTimestamp(visit.createdAt) || '') || '—' }}
                    </p>
                  </div>
                  <div class="text-right text-sm text-charcoal-600">
                    <p class="font-semibold text-charcoal-950">
                      {{ visit.service_ids?.length ? `${visit.service_ids.length} усл.` : 'Услуги не указаны' }}
                    </p>
                    <p class="text-xs text-charcoal-500">
                      {{ visit.status ? `Статус: ${visit.status}` : 'Статус неизвестен' }}
                    </p>
                    <p class="text-xs text-charcoal-500">
                      {{ getVisitAmount(visit) !== null ? `Сумма: ${formatMoney(getVisitAmount(visit))}` : 'Сумма не указана' }}
                    </p>
                  </div>
                </div>
                <div v-if="visit.service_ids?.length" class="mt-2 text-xs text-charcoal-600 space-y-1">
                  <p class="font-semibold text-charcoal-800">Услуги:</p>
                  <ul class="list-disc space-y-1 pl-4">
                    <li v-for="(svc, i) in getVisitServices(visit)" :key="`${visit.id || index}-svc-${i}`">
                      {{ svc }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <SharedEmptyState
              v-else
              description="Для этого клиента визиты не найдены."
              icon="i-lucide-notebook-pen"
              title="Пусто"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
