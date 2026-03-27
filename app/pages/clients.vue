<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { formatCount, formatDateTime } from '~/utils/format'

type ClientRow = {
  phone: string
  name: string
  visits: number
  firstSeen: string | null
  lastSeen: string | null
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

const uiStore = useUiStore()
const historyApi = useHistoryApi()

const columns: TableColumn<ClientRow>[] = [
  { accessorKey: 'phone', header: 'Телефон' },
  { accessorKey: 'name', header: 'Имя' },
  { accessorKey: 'visits', header: 'Визиты' },
  { accessorKey: 'firstSeen', header: 'Первый визит' },
  { accessorKey: 'lastSeen', header: 'Последний визит' }
]

const page = ref(1)
const pageSize = 10

const { data, pending, refresh } = await useAsyncData('clients-directory', async () => {
  const response = await historyApi.list({
    end_date: uiStore.statisticsRange.end,
    start_date: uiStore.statisticsRange.start
  })

  return { items: Array.isArray((response as any)?.items) ? (response as any).items : [] }
}, {
  watch: [() => uiStore.statisticsRange.start, () => uiStore.statisticsRange.end]
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

const pageCount = computed(() => Math.max(1, Math.ceil(clientRows.value.length / pageSize)))
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return clientRows.value.slice(start, start + pageSize)
})

watch([clientRows, page], () => {
  if (page.value > pageCount.value) {
    page.value = pageCount.value
  }
})
</script>

<template>
  <UDashboardPanel id="clients">
    <template #body>
      <div class="flex items-center justify-between pb-4">
        <div class="flex items-center gap-3">
          <UBadge color="neutral" size="lg" variant="soft">
            {{ formatCount(clientRows.length) }} клиентов
          </UBadge>
        </div>
        <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
          Обновить
        </UButton>
      </div>

      <div class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
        <div class="max-h-[80vh] overflow-auto">
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
          </UTable>
        </div>
        <div class="flex items-center justify-end gap-3 border-t border-charcoal-100 px-4 py-3">
          <span class="text-xs text-charcoal-500">
            Показано {{ pagedRows.length ? (page - 1) * pageSize + 1 : 0 }}–{{ Math.min(page * pageSize, clientRows.length) }} из {{ clientRows.length }}
          </span>
          <UPagination
            v-model="page"
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
    </template>
  </UDashboardPanel>
</template>
