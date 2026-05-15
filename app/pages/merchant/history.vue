<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { formatDateTime, formatMoney } from '~/utils/format'
import { formatPaymentMethod } from '~/utils/display'
import type { MerchantQueueEntry } from '~/composables/useMerchantApi'

definePageMeta({
  layout: 'merchant'
})

type HistoryRow = {
  id: string
  created_at: string | null
  branch: string
  customer: string
  status: string | null
  amount: string | number | null
  payment_method: string | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function toHistoryRow(value: MerchantQueueEntry): HistoryRow {
  const id = normalizeText(value?.id) || ''
  const branch = normalizeText((value as any)?.branches?.name) || normalizeText((value as any)?.branch?.name) || '—'
  const customer = normalizeText((value as any)?.customer_name) || normalizeText((value as any)?.phone_number) || '—'

  return {
    amount: (value as any)?.amount ?? null,
    branch,
    created_at: (value as any)?.created_at ?? null,
    customer,
    id,
    payment_method: (value as any)?.payment_method ?? null,
    status: (value as any)?.status ?? null
  }
}

function dateToStartIso(date: string) {
  const [y, m, d] = date.split('-').map(part => Number.parseInt(part, 10))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}

function dateToEndIso(date: string) {
  const [y, m, d] = date.split('-').map(part => Number.parseInt(part, 10))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

const merchantApi = useMerchantApi()

const filters = reactive({
  from: '',
  to: ''
})

const queryParams = computed(() => {
  const from = filters.from ? dateToStartIso(filters.from) : null
  const to = filters.to ? dateToEndIso(filters.to) : null

  return {
    from: from || undefined,
    limit: 100,
    to: to || undefined
  }
})

const { data, pending, refresh } = await useAsyncData('merchant-history', async () => {
  return await merchantApi.history(queryParams.value)
}, { watch: [queryParams] })

const rows = computed<HistoryRow[]>(() => {
  const items = (data.value as any)?.items
  return Array.isArray(items) ? items.map(toHistoryRow) : []
})

const columns: TableColumn<HistoryRow>[] = [
  { accessorKey: 'created_at', header: 'Дата' },
  { accessorKey: 'branch', header: 'Филиал' },
  { accessorKey: 'customer', header: 'Клиент' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'amount', header: 'Сумма' },
  { accessorKey: 'payment_method', header: 'Оплата' }
]
</script>

<template>
  <UDashboardPanel id="merchant-history">
    <template #header>
      <UDashboardNavbar title="История" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="pending"
            variant="outline"
            @click="refresh()"
          >
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-1">
                <h2 class="barbershop-heading text-xl text-charcoal-950">
                  История мерчанта
                </h2>
                <p class="text-sm text-charcoal-500">
                  Записи по филиалам вашего барбершопа, кроме активных статусов.
                </p>
              </div>

              <div class="flex flex-wrap items-end gap-2">
                <UFormField label="С" class="min-w-[10rem]">
                  <UInput v-model="filters.from" type="date" />
                </UFormField>
                <UFormField label="По" class="min-w-[10rem]">
                  <UInput v-model="filters.to" type="date" />
                </UFormField>
              </div>
            </div>
          </template>

          <div
            v-if="rows.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="columns" :data="rows">
              <template #created_at-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.created_at ? formatDateTime(row.original.created_at) : '—' }}
                </span>
              </template>

              <template #status-cell="{ row }">
                <SharedStatusBadge :label="row.original.status" />
              </template>

              <template #amount-cell="{ row }">
                <span class="text-sm font-medium text-charcoal-950">
                  {{ row.original.amount !== null && row.original.amount !== undefined ? formatMoney(row.original.amount) : '—' }}
                </span>
              </template>

              <template #payment_method-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ formatPaymentMethod(row.original.payment_method) }}
                </span>
              </template>
            </UTable>
          </div>

          <div v-else class="py-10 text-center text-sm text-charcoal-500">
            Записей пока нет.
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
