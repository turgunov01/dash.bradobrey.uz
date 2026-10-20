<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import type { QueueItem } from '~~/shared/schemas'
import { formatMoney } from '~/utils/format'
import { formatPaymentMethod } from '~/utils/display'

const props = defineProps<{
  items: QueueItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  call: [item: QueueItem]
  complete: [item: QueueItem]
  open: [item: QueueItem]
  start: [item: QueueItem]
}>()

const columns: TableColumn<QueueItem>[] = [
  { accessorKey: 'customer_name', header: 'Клиент' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'payment_method', header: 'Оплата' },
  { accessorKey: 'amount', header: 'Сумма' },
  { id: 'actions', header: '' }
]
</script>

<template>
  <div class="overflow-hidden rounded-[1rem] border border-charcoal-200 bg-white/90">
    <UTable
      :columns="columns"
      :data="props.items"
      :loading="props.loading"
      sticky="header"
      :ui="{
        root: 'max-h-[32rem] overflow-auto',
        base: 'min-w-[52rem]',
        thead: 'bg-charcoal-50/90',
        tbody: 'divide-y divide-charcoal-100',
        th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
        td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
      }"
    >
      <template #customer_name-cell="{ row }">
        <div class="space-y-1">
          <p class="font-medium text-charcoal-950">
            {{ row.original.customer_name || 'Клиент без записи' }}
          </p>
          <p class="text-xs text-charcoal-500">
            {{ row.original.phone_number || 'Телефон не указан' }}
          </p>
        </div>
      </template>

      <template #status-cell="{ row }">
        <SharedStatusBadge :label="row.original.status" />
      </template>

      <template #payment_method-cell="{ row }">
        <span>{{ formatPaymentMethod(row.original.payment_method) }}</span>
      </template>

      <template #amount-cell="{ row }">
        <span class="font-medium">{{ formatMoney(row.original.amount) }}</span>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex flex-wrap justify-end gap-2">
          <UButton color="neutral" size="xs" variant="outline" @click="emit('open', row.original)">
            Открыть
          </UButton>
          <UButton color="neutral" size="xs" variant="outline" @click="emit('call', row.original)">
            Вызвать
          </UButton>
          <UButton color="primary" size="xs" variant="outline" @click="emit('start', row.original)">
            Начать
          </UButton>
          <UButton color="primary" size="xs" @click="emit('complete', row.original)">
            Завершить
          </UButton>
        </div>
      </template>
    </UTable>
  </div>
</template>
