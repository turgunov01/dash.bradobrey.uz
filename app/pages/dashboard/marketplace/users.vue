<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { formatDateTime } from '~/utils/format'

type MobileUser = {
  id: string
  display_name: string | null
  phone: string | null
  language: string | null
  is_active: boolean
  created_at: string | null
  last_login_at: string | null
}

const api = useDashboardMarketplaceApi()
const apiClient = useApiClient()
const search = ref('')
const active = ref('all')
const page = ref(1)
const pageSize = 25
const testNotificationId = ref<string | null>(null)

const columns: TableColumn<MobileUser>[] = [
  { accessorKey: 'display_name', header: 'Имя' },
  { accessorKey: 'phone', header: 'Телефон' },
  { accessorKey: 'language', header: 'Язык' },
  { accessorKey: 'is_active', header: 'Статус' },
  { accessorKey: 'created_at', header: 'Регистрация' },
  { accessorKey: 'last_login_at', header: 'Последний вход' },
  { id: 'actions', header: '' }
]

const { data, pending, refresh } = await useAsyncData('marketplace-mobile-users', () => api.fetchMobileUsers({
  q: search.value.trim() || undefined,
  active: active.value === 'all' ? undefined : active.value === 'active',
  limit: pageSize,
  offset: (page.value - 1) * pageSize
}), { server: false, watch: [page, active] })

const rows = computed(() => (data.value?.items || []) as MobileUser[])
const total = computed(() => Number(data.value?.count || 0))
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function submitSearch() {
  page.value = 1
  refresh()
}

async function sendTestNotification(user: MobileUser) {
  const label = user.display_name || user.phone || 'пользователю'
  if (import.meta.client && !window.confirm(`Отправить тестовое уведомление пользователю ${label}?`)) return

  testNotificationId.value = user.id
  try {
    await api.sendTestNotification(user.id)
    apiClient.notifySuccess('Тестовое уведомление отправлено', label)
  } finally {
    testNotificationId.value = null
  }
}
</script>

<template>
  <UDashboardPanel id="marketplace-mobile-users">
    <template #header>
      <UDashboardNavbar title="Пользователи мобильного приложения">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-charcoal-500">Зарегистрированные через мобильное приложение: {{ total }}</p>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="pending" @click="refresh()">Обновить</UButton>
        </div>
        <div class="flex flex-wrap gap-3">
          <UInput v-model="search" class="min-w-64" icon="i-lucide-search" placeholder="Имя или телефон" @keyup.enter="submitSearch" />
          <USelect v-model="active" :items="[{ label: 'Все пользователи', value: 'all' }, { label: 'Активные', value: 'active' }, { label: 'Отключённые', value: 'inactive' }]" class="w-48" />
          <UButton color="primary" @click="submitSearch">Найти</UButton>
        </div>
        <UTable :columns="columns" :data="rows" :loading="pending">
          <template #actions-cell="{ row }">
            <div class="flex justify-end">
              <UButton
                color="primary"
                icon="i-lucide-bell-ring"
                size="xs"
                variant="outline"
                :loading="testNotificationId === row.original.id"
                :disabled="!!testNotificationId"
                @click="sendTestNotification(row.original)"
              >
                Тест
              </UButton>
            </div>
          </template>
        </UTable>
        <div class="flex justify-end border-t border-charcoal-100 pt-3">
          <UPagination v-model:page="page" :page-count="pageCount" :total="total" :per-page="pageSize" size="sm" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
