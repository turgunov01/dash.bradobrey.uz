<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { refDebounced } from '@vueuse/core'

import { formatDateTime } from '~/utils/format'

type ActiveFilter = 'all' | 'active'

const marketplaceApi = useMarketplaceApi()

const activeFilter = ref<ActiveFilter>('all')
const searchQuery = ref('')
const debouncedQuery = refDebounced(searchQuery, 350)

const page = ref(1)
const pageSize = 50

const filterItems = [
  { label: 'Все', value: 'all' as const },
  { label: 'Активные', value: 'active' as const }
]

function extractItems(response: unknown): any[] {
  if (Array.isArray(response)) {
    return response
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as any

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.entry)) {
    return payload.entry
  }

  if (payload.payload && typeof payload.payload === 'object') {
    const inner = payload.payload

    if (Array.isArray(inner.items)) {
      return inner.items
    }

    if (Array.isArray(inner.data)) {
      return inner.data
    }
  }

  return []
}

function extractCount(response: unknown) {
  if (!response || typeof response !== 'object') {
    return 0
  }

  const payload = response as any

  if (typeof payload.count === 'number') {
    return payload.count
  }

  if (typeof payload.total === 'number') {
    return payload.total
  }

  if (payload.payload && typeof payload.payload === 'object') {
    const inner = payload.payload
    if (typeof inner.count === 'number') {
      return inner.count
    }
    if (typeof inner.total === 'number') {
      return inner.total
    }
  }

  return extractItems(response).length
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

const columns: TableColumn<any>[] = [
  { accessorKey: 'email', header: 'email' },
  { accessorKey: 'phone', header: 'phone' },
  { accessorKey: 'created_at', header: 'created_at' },
  { accessorKey: 'last_login_at', header: 'last_login_at' },
  { accessorKey: 'is_active', header: 'is_active' },
  { id: 'actions', header: 'Действия' }
]

watch([activeFilter, debouncedQuery], () => {
  page.value = 1
})

const { data, pending, refresh } = await useAsyncData('admin-marketplace-clients', async () => {
  const active = activeFilter.value === 'active' ? true : null
  const response = await marketplaceApi.clients.list({
    active,
    limit: pageSize,
    offset: (page.value - 1) * pageSize,
    q: debouncedQuery.value
  })

  return {
    count: extractCount(response),
    items: extractItems(response)
  }
}, {
  server: false,
  watch: [() => activeFilter.value, () => page.value, () => debouncedQuery.value]
})

const rows = computed(() => {
  const raw = Array.isArray(data.value?.items) ? data.value?.items : []

  return raw.map((item, index) => ({
    created_at: normalizeText(item?.created_at ?? item?.createdAt),
    email: normalizeText(item?.email) || '—',
    id: String(item?.id ?? item?._id ?? `client-${index}`),
    is_active: Boolean(item?.is_active ?? item?.active ?? false),
    last_login_at: normalizeText(item?.last_login_at ?? item?.lastLoginAt),
    phone: normalizeText(item?.phone) || '—',
    raw: item
  }))
})

const totalCount = computed(() => Number(data.value?.count || 0))
const pageCount = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

watch(pageCount, (count) => {
  if (page.value > count) {
    page.value = count
  }
})

async function toggleActive(row: any) {
  const item = row?.raw ?? row
  const id = normalizeText(item?.id ?? item?._id)

  if (!id) return

  if (Boolean(item?.is_active ?? item?.active ?? false)) {
    await marketplaceApi.clients.deactivate(id)
  }
  else {
    await marketplaceApi.clients.activate(id)
  }

  await refresh()
}
</script>

<template>
  <UCard class="warm-card overflow-hidden rounded-[1.9rem] border border-charcoal-200">
    <template #header>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
            Marketplace
          </p>
          <h3 class="text-2xl text-charcoal-950">
            Клиенты
          </h3>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Поиск по email/phone"
            class="w-full sm:w-64"
          />

          <USelectMenu
            v-model="activeFilter"
            :items="filterItems"
            value-key="value"
            class="w-full sm:w-44"
          />
        </div>
      </div>
    </template>

    <div v-if="rows.length" class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
      <div class="max-h-[78vh] overflow-auto">
        <UTable
          :columns="columns"
          :data="rows"
          :loading="pending"
          :ui="{
            root: 'w-full overflow-auto',
            base: 'w-full min-w-[54rem]',
            thead: 'bg-charcoal-50/90',
            tbody: 'divide-y divide-charcoal-100',
            th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
            td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
          }"
          sticky="header"
        >
          <template #email-cell="{ row }">
            <div class="space-y-1">
              <p class="font-semibold text-charcoal-950">
                {{ row.original.email }}
              </p>
              <p class="text-xs text-charcoal-500">
                {{ row.original.phone !== '—' ? row.original.phone : 'Телефон не указан' }}
              </p>
            </div>
          </template>

          <template #created_at-cell="{ row }">
            {{ row.original.created_at ? formatDateTime(row.original.created_at) : '—' }}
          </template>

          <template #last_login_at-cell="{ row }">
            {{ row.original.last_login_at ? formatDateTime(row.original.last_login_at) : '—' }}
          </template>

          <template #is_active-cell="{ row }">
            <SharedStatusBadge :label="row.original.is_active ? 'active' : 'inactive'" />
          </template>

          <template #actions-cell="{ row }">
            <UButton color="neutral" size="xs" variant="outline" @click="toggleActive(row.original)">
              {{ row.original.is_active ? 'Деактивировать' : 'Активировать' }}
            </UButton>
          </template>
        </UTable>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-charcoal-100 px-4 py-3">
        <span class="text-xs text-charcoal-500">
          Показано {{ rows.length ? (page - 1) * pageSize + 1 : 0 }}–{{ Math.min(page * pageSize, totalCount) }} из {{ totalCount }}
        </span>
        <UPagination
          v-model:page="page"
          :page-count="pageCount"
          :total="totalCount"
          :per-page="pageSize"
          size="sm"
        />
      </div>
    </div>

    <SharedEmptyState
      v-else
      description="Эндпоинт /api/marketplace/clients не вернул ни одного клиента."
      icon="i-lucide-users-round"
      title="Клиентов нет"
    />
  </UCard>
</template>
