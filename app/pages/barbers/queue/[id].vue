<script setup lang="ts">
import { queueEditBeforeCompleteSchema, queueUpdateSchema, type QueueCompletePayload } from '~~/shared/schemas'
import { formatDateTime, formatMoney } from '~/utils/format'
import { formatPaymentMethod } from '~/utils/display'
import { flattenServicesPayload } from '~/utils/services'

const apiClient = useApiClient()

const route = useRoute()
const barbersApi = useBarbersApi()
const kioskApi = useKioskApi()

const queueId = computed(() => String(route.params.id))
const completing = ref(false)
const paymentModalOpen = ref(false)
const updateForm = reactive({
  payment_method: '',
  service_ids: [] as string[],
  status: ''
})
const overrideForm = reactive({
  amount: 0,
  reason: ''
})

const { data, pending, refresh } = await useAsyncData('barber-queue-detail', async () => {
  const [detail, services] = await Promise.all([
    barbersApi.queueItem(queueId.value, { silent: true }),
    kioskApi.services({ active: true, grouped: true })
  ])

  return {
    detail,
    services
  }
}, {
  watch: [queueId]
})

const queueItem = computed<Record<string, any> | null>(() => (data.value?.detail as any)?.data || null)
const queueStatusCode = computed(() => (data.value?.detail as any)?.status || 200)

const flatServices = computed(() => flattenServicesPayload(data.value?.services))
const servicePriceMap = computed(() =>
  new Map(
    flatServices.value.map((service: any) => [
      String(service.id),
      Number(service.base_price ?? service.price ?? 0) || 0
    ])
  )
)

const serviceOptions = computed(() =>
  flatServices.value.map((service: any) => ({
    label: `${service.name || 'Услуга без названия'}${service.category ? ` / ${service.category}` : ''}`,
    value: String(service.id)
  }))
)
const completionAmount = computed(() => {
  const directAmount = Number(queueItem.value?.amount ?? queueItem.value?.price_override ?? 0)

  if (Number.isFinite(directAmount) && directAmount > 0) {
    return directAmount
  }

  return updateForm.service_ids.reduce((sum, serviceId) => {
    return sum + (servicePriceMap.value.get(String(serviceId)) || 0)
  }, 0)
})

watch(
  queueItem,
  (item) => {
    updateForm.status = item?.status || ''
    updateForm.payment_method = item?.payment_method || ''
    updateForm.service_ids = Array.isArray(item?.service_ids)
      ? item.service_ids.map((value: string | number) => String(value))
      : item?.service_id
        ? [String(item.service_id)]
        : []

    overrideForm.amount = Number(item?.price_override ?? item?.amount ?? 0)
    overrideForm.reason = item?.price_override_reason || ''
  },
  { immediate: true }
)

async function submitUpdate() {
  const payload = queueUpdateSchema.safeParse({
    payment_method: updateForm.payment_method || undefined,
    service_ids: updateForm.service_ids.length ? updateForm.service_ids : undefined,
    status: updateForm.status || undefined
  })

  if (!payload.success) {
    apiClient.notifyError(new Error(payload.error.issues[0]?.message || 'Некорректное обновление очереди'))
    return
  }

  await barbersApi.updateQueue(queueId.value, payload.data)
  await refresh()
}

async function saveOverride() {
  const payload = queueEditBeforeCompleteSchema.safeParse(overrideForm)

  if (!payload.success) {
    apiClient.notifyError(new Error(payload.error.issues[0]?.message || 'Некорректная корректировка перед завершением'))
    return
  }

  await barbersApi.updateQueueBeforeComplete(queueId.value, payload.data)
  await refresh()
}

async function callEntry() {
  await barbersApi.callQueue(queueId.value)
  await refresh()
}

async function startEntry() {
  await barbersApi.startQueue(queueId.value)
  await refresh()
}

function completeEntry() {
  paymentModalOpen.value = true
}

async function submitComplete(payload: QueueCompletePayload) {
  completing.value = true

  try {
    await barbersApi.completeQueue(queueId.value, payload)
    paymentModalOpen.value = false
    await refresh()
  }
  finally {
    completing.value = false
  }
}

async function markNoShow() {
  await barbersApi.updateQueueNoShow(queueId.value, { no_show: true })
  await refresh()
}

async function markNotInTime() {
  await barbersApi.updateQueueNotInTime(queueId.value)
  await refresh()
}
</script>

<template>
  <UDashboardPanel id="queue-detail">
    <template #header>
      <UDashboardNavbar :title="queueItem?.customer_name || `Запись очереди ${queueId}`" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton color="neutral" icon="i-lucide-arrow-left" to="/barbers/workspace" variant="outline">
            Назад
          </UButton>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UAlert
          v-if="queueStatusCode === 209"
          color="warning"
          icon="i-lucide-badge-alert"
          title="Завершенная запись очереди"
          description="Бэкенд вернул HTTP 209 для этой записи. Просмотр деталей остается доступным, но запись уже завершена."
          variant="soft"
        />

        <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
            <template #header>
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Сводка по очереди
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  Отслеживание текущего визита
                </h2>
              </div>
            </template>

            <div v-if="queueItem" class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">Статус</p>
                <div class="mt-3">
                  <SharedStatusBadge :label="queueItem.status" />
                </div>
              </div>
              <div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">Оплата</p>
                <p class="mt-3 text-lg font-semibold text-charcoal-950">{{ formatPaymentMethod(queueItem.payment_method) }}</p>
              </div>
              <div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">Создано</p>
                <p class="mt-3 text-lg font-semibold text-charcoal-950">{{ formatDateTime(queueItem.created_at) }}</p>
              </div>
              <div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">Сумма</p>
                <p class="mt-3 text-lg font-semibold text-charcoal-950">{{ formatMoney(queueItem.amount) }}</p>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-3">
              <UButton color="neutral" icon="i-lucide-phone-call" variant="outline" @click="callEntry">
                Вызвать
              </UButton>
              <UButton color="primary" icon="i-lucide-play" variant="outline" @click="startEntry">
                Начать
              </UButton>
              <UButton color="primary" icon="i-lucide-check-check" @click="completeEntry">
                Завершить
              </UButton>
            </div>
          </UCard>

          <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
            <template #header>
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Обновление
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  Изменение услуг и статуса
                </h2>
              </div>
            </template>

            <div class="space-y-5">
              <UFormField label="Статус">
                <UInput v-model="updateForm.status" placeholder="ожидает, начато, завершено" />
              </UFormField>

              <UFormField label="Способ оплаты">
                <UInput v-model="updateForm.payment_method" placeholder="наличные, карта, сертификат" />
              </UFormField>

              <UFormField label="Услуги">
                <USelectMenu
                  v-model="updateForm.service_ids"
                  class="w-full"
                  :items="serviceOptions"
                  multiple
                  placeholder="Выберите одну или несколько услуг"
                  value-key="value"
                />
              </UFormField>

              <div class="flex justify-end">
                <UButton color="primary" icon="i-lucide-save" @click="submitUpdate">
                  Сохранить изменения очереди
                </UButton>
              </div>

              <div class="rounded-[1.5rem] border border-charcoal-200 bg-white/80 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500">
                  Редактирование перед завершением
                </p>

                <div class="mt-4 grid gap-4 sm:grid-cols-[0.45fr_0.55fr]">
                  <UFormField label="Корректировка суммы">
                    <UInput v-model="overrideForm.amount" type="number" />
                  </UFormField>
                  <UFormField label="Причина">
                    <UInput v-model="overrideForm.reason" placeholder="Причина корректировки" />
                  </UFormField>
                </div>

                <div class="mt-4 flex justify-end">
                  <UButton color="neutral" icon="i-lucide-pencil-line" variant="outline" @click="saveOverride">
                    Сохранить корректировку
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <div class="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
          <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
            <template #header>
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Флаги
                </p>
                <h2 class="barbershop-heading text-2xl text-charcoal-950">
                  Нестандартные исходы
                </h2>
              </div>
            </template>

            <div class="space-y-3">
              <UButton block color="warning" icon="i-lucide-user-round-x" variant="outline" @click="markNotInTime">
                Отметить как не вовремя
              </UButton>
              <UButton block color="error" icon="i-lucide-ban" variant="outline" @click="markNoShow">
                Отметить как неявку
              </UButton>
            </div>
          </UCard>

          <SharedJsonBlock label="Сырые данные очереди" :value="queueItem || {}" />
        </div>
      </div>

      <QueueCompletePaymentModal
        v-model:open="paymentModalOpen"
        :amount="completionAmount"
        :loading="completing"
        title="Завершить заказ"
        @submit="submitComplete"
      />
    </template>
  </UDashboardPanel>
</template>
