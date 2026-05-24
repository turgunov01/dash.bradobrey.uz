<script setup lang="ts">
import { formatMoney } from '~/utils/format'

const props = defineProps<{
  amount?: number | string | null
  loading?: boolean
  open: boolean
  title?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: { payments?: Array<{ amount: number, method: 'cash' | 'card' }> }]
}>()

const form = reactive({
  card: 0,
  cash: 0
})

const total = computed(() => {
  const value = Number(props.amount)
  return Number.isFinite(value) && value > 0 ? value : 0
})
const paidTotal = computed(() => Number(form.cash || 0) + Number(form.card || 0))
const difference = computed(() => Number((total.value - paidTotal.value).toFixed(2)))
const hasKnownTotal = computed(() => total.value > 0)
const canSubmit = computed(() => !hasKnownTotal.value || Math.abs(difference.value) < 0.01)

watch(
  () => [props.open, props.amount] as const,
  ([open]) => {
    if (!open) {
      return
    }

    form.cash = total.value
    form.card = 0
  },
  { immediate: true }
)

function close() {
  emit('update:open', false)
}

function submit() {
  if (!canSubmit.value || props.loading) {
    return
  }

  const payments: Array<{ amount: number, method: 'cash' | 'card' }> = []
  const cash = Number(form.cash || 0)
  const card = Number(form.card || 0)

  if (cash > 0) {
    payments.push({ amount: cash, method: 'cash' })
  }

  if (card > 0) {
    payments.push({ amount: card, method: 'card' })
  }

  emit('submit', payments.length ? { payments } : {})
}
</script>

<template>
  <UModal :open="props.open" :title="props.title || 'Завершить заказ'" description="Укажите, как клиент закрыл оплату." @update:open="emit('update:open', $event)">
    <template #body>
      <div class="space-y-4">
        <div class="rounded-[1.25rem] border border-charcoal-200 bg-white/90 px-4 py-3">
          <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Итого</p>
          <p class="mt-1 text-xl font-semibold text-charcoal-950">
            {{ hasKnownTotal ? formatMoney(total) : 'Сумма не рассчитана' }}
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Наличные">
            <UInput v-model.number="form.cash" min="0" step="1000" type="number" />
          </UFormField>
          <UFormField label="Карта">
            <UInput v-model.number="form.card" min="0" step="1000" type="number" />
          </UFormField>
        </div>

        <UAlert
          v-if="hasKnownTotal && !canSubmit"
          color="warning"
          icon="i-lucide-badge-alert"
          :title="difference > 0 ? 'Не хватает суммы' : 'Сумма больше итога'"
          :description="`Разница: ${formatMoney(Math.abs(difference))}`"
          variant="soft"
        />

        <div class="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] bg-charcoal-50/70 px-4 py-3">
          <div>
            <p class="text-xs uppercase tracking-[0.16em] text-charcoal-500">Внесено</p>
            <p class="mt-1 text-base font-semibold text-charcoal-950">{{ formatMoney(paidTotal) }}</p>
          </div>
          <UBadge :color="canSubmit ? 'primary' : 'warning'" variant="soft">
            {{ canSubmit ? 'Готово' : 'Проверьте сумму' }}
          </UBadge>
        </div>

        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="props.loading" @click="close">
            Отмена
          </UButton>
          <UButton color="primary" icon="i-lucide-check-check" :disabled="!canSubmit" :loading="props.loading" @click="submit">
            Завершить
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
