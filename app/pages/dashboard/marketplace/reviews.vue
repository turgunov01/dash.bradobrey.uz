<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { formatDateTime } from '~/utils/format'

type MarketplaceReview = {
  id: string
  rating: number
  comment: string | null
  client_name: string
  client_phone: string | null
  barber_name: string
  barbershop_name: string
  created_at: string | null
}

const api = useDashboardMarketplaceApi()
const search = ref('')
const rating = ref('all')
const page = ref(1)
const pageSize = 25

const columns: TableColumn<MarketplaceReview>[] = [
  { accessorKey: 'rating', header: 'Оценка' },
  { accessorKey: 'barber_name', header: 'Барбер' },
  { accessorKey: 'barbershop_name', header: 'Барбершоп' },
  { accessorKey: 'client_name', header: 'Пользователь' },
  { accessorKey: 'comment', header: 'Отзыв' },
  { accessorKey: 'created_at', header: 'Дата' }
]

const { data, pending, refresh } = await useAsyncData('marketplace-reviews', () => api.fetchReviews({
  q: search.value.trim() || undefined,
  rating: rating.value === 'all' ? undefined : Number(rating.value),
  limit: pageSize,
  offset: (page.value - 1) * pageSize
}), { server: false, watch: [page, rating] })

const rows = computed(() => (data.value?.items || []) as MarketplaceReview[])
const total = computed(() => Number(data.value?.count || 0))
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function stars(value: number) {
  return '★'.repeat(Math.max(0, Math.min(5, Number(value))))
}

function submitSearch() {
  page.value = 1
  refresh()
}
</script>

<template>
  <UDashboardPanel id="marketplace-reviews">
    <template #header>
      <UDashboardNavbar title="Отзывы клиентов">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-charcoal-500">Отзывы по барберам: {{ total }}</p>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="pending" @click="refresh()">Обновить</UButton>
        </div>
        <div class="flex flex-wrap gap-3">
          <UInput v-model="search" class="min-w-64" icon="i-lucide-search" placeholder="Барбер, пользователь или текст" @keyup.enter="submitSearch" />
          <USelect v-model="rating" :items="[{ label: 'Все оценки', value: 'all' }, { label: '5 звёзд', value: '5' }, { label: '4 звезды', value: '4' }, { label: '3 звезды', value: '3' }, { label: '2 звезды', value: '2' }, { label: '1 звезда', value: '1' }]" class="w-48" />
          <UButton color="primary" @click="submitSearch">Найти</UButton>
        </div>
        <UTable :columns="columns" :data="rows" :loading="pending">
          <template #rating-cell="{ row }"><span class="text-amber-500">{{ stars(row.original.rating) }}</span></template>
          <template #comment-cell="{ row }"><span class="line-clamp-2 max-w-md">{{ row.original.comment || 'Без комментария' }}</span></template>
          <template #client_name-cell="{ row }"><div>{{ row.original.client_name }}</div><div class="text-xs text-charcoal-500">{{ row.original.client_phone || 'Телефон не указан' }}</div></template>
          <template #created_at-cell="{ row }">{{ row.original.created_at ? formatDateTime(row.original.created_at) : '—' }}</template>
        </UTable>
        <div class="flex justify-end border-t border-charcoal-100 pt-3">
          <UPagination v-model:page="page" :page-count="pageCount" :total="total" :per-page="pageSize" size="sm" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
