<script setup lang="ts">
import type { QueueCompletePayload, QueueItem } from '~~/shared/schemas'
import type { PendingQueueTransfer } from '~/composables/useBarbersApi'
import { flattenServicesPayload } from '~/utils/services'

const sessionStore = useSessionStore()
const barbersApi = useBarbersApi()
const kioskApi = useKioskApi()
const breakMinutes = ref(10)
const completing = ref(false)
const shifting = ref(false)
const paymentModalOpen = ref(false)
const completingItem = ref<QueueItem | null>(null)
const transferRespondingId = ref('')
const transferRespondingDecision = ref<'accept' | 'reject' | ''>('')
const toast = useToast()

useRealtimeQueue()

await sessionStore.ensureLoaded()

const { data, pending, refresh } = await useAsyncData('barber-workspace', async () => {
  const [me, services] = await Promise.all([
    barbersApi.me({ silent: true }),
    kioskApi.services({ active: true, grouped: true })
  ])

  return {
    me,
    queue: { count: 0, items: [] },
    services
  }
})

const { data: pendingTransfersData, refresh: refreshPendingTransfers } = await useAsyncData(
  'barber-pending-transfers',
  async () => (await barbersApi.pendingTransfers()).items || [],
  { default: () => [] as PendingQueueTransfer[] }
)

const pendingTransfers = computed(() => pendingTransfersData.value || [])
let transferWatchStarted = false
let knownTransferIds = new Set<string>()

watch(pendingTransfers, (transfers) => {
  const currentIds = new Set(transfers.map(transfer => String(transfer.id)))
  if (transferWatchStarted) {
    transfers
      .filter(transfer => !knownTransferIds.has(String(transfer.id)))
      .forEach((transfer) => {
        toast.add({
          color: 'warning',
          title: 'Вам передали клиента',
          description: `${transfer.client_name || 'Клиент'} · от ${transfer.from_barber_name || 'другого барбера'}`
        })
      })
  }
  knownTransferIds = currentIds
  transferWatchStarted = true
}, { deep: true, immediate: true })

const servicePriceMap = computed(() =>
  new Map(
    flattenServicesPayload(data.value?.services).map((service: any) => [
      String(service.id),
      Number(service.base_price ?? service.price ?? 0) || 0
    ])
  )
)
const queueItems = computed(() =>
  (data.value?.queue?.items || []).map((item: QueueItem) => ({
    ...item,
    amount: getQueueItemAmount(item)
  }))
)
const completingAmount = computed(() =>
  completingItem.value ? getQueueItemAmount(completingItem.value) : 0
)

function getQueueItemServiceIds(item: QueueItem) {
  const ids = Array.isArray(item.service_ids) && item.service_ids.length
    ? item.service_ids
    : item.service_id
      ? [item.service_id]
      : []

  return ids.map(id => String(id))
}

function getQueueItemAmount(item: QueueItem) {
  const directAmount = Number(item.amount ?? item.price_override ?? 0)

  if (Number.isFinite(directAmount) && directAmount > 0) {
    return directAmount
  }

  return getQueueItemServiceIds(item).reduce((sum, serviceId) => {
    return sum + (servicePriceMap.value.get(serviceId) || 0)
  }, 0)
}

async function startBreak() {
  await barbersApi.break({ minutes: Number(breakMinutes.value) })
  await Promise.all([sessionStore.ensureLoaded(), refresh()])
}

async function returnFromBreak() {
  await barbersApi.returnFromBreak()
  await Promise.all([sessionStore.ensureLoaded(), refresh()])
}

async function startShift() {
  shifting.value = true

  try {
    await barbersApi.startShift()
    await Promise.all([sessionStore.ensureLoaded({ force: true }), refresh()])
  }
  finally {
    shifting.value = false
  }
}

async function endShift() {
  shifting.value = true

  try {
    await barbersApi.endShift()
    await Promise.all([sessionStore.ensureLoaded({ force: true }), refresh()])
  }
  finally {
    shifting.value = false
  }
}

async function callItem(item: any) {
  await barbersApi.callQueue(String(item.id))
  await refresh()
}

async function startItem(item: any) {
  await barbersApi.startQueue(String(item.id))
  await refresh()
}

async function respondToTransfer(transfer: PendingQueueTransfer, decision: 'accept' | 'reject') {
  if (transferRespondingId.value) return
  transferRespondingId.value = String(transfer.id)
  transferRespondingDecision.value = decision
  try {
    await barbersApi.respondToTransfer(String(transfer.id), decision)
    await Promise.all([refreshPendingTransfers(), refresh(), sessionStore.ensureLoaded({ force: true })])
  }
  finally {
    transferRespondingId.value = ''
    transferRespondingDecision.value = ''
  }
}

function completeItem(item: QueueItem) {
  completingItem.value = item
  paymentModalOpen.value = true
}

async function submitComplete(payload: QueueCompletePayload) {
  if (!completingItem.value) {
    return
  }

  completing.value = true

  try {
    await barbersApi.completeQueue(String(completingItem.value.id), payload)
    paymentModalOpen.value = false
    completingItem.value = null
    await refresh()
  }
  finally {
    completing.value = false
  }
}

function openItem(item: any) {
  return navigateTo(`/barbers/queue/${item.id}`)
}
</script>

<template>
  <UDashboardPanel id="workspace">
    <template #header>
      <UDashboardNavbar title="Рабочее место барбера" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            v-if="['manager', 'super-manager', 'admin'].includes(String(sessionStore.user?.role || '').toLowerCase())"
            color="neutral"
            icon="i-lucide-receipt"
            to="/barbers/expenses"
            variant="outline"
          >
            Расходы
          </UButton>
          <UBadge
            :color="sessionStore.barber?.is_on_break ? 'warning' : (sessionStore.barber?.is_on_shift ? 'primary' : 'neutral')"
            variant="soft"
          >
            {{ sessionStore.barber?.is_on_break ? 'На перерыве' : (sessionStore.barber?.is_on_shift ? 'На смене' : 'Не на смене') }}
          </UBadge>
          <UButton
            v-if="!sessionStore.barber?.is_on_shift"
            color="primary"
            icon="i-lucide-play"
            :loading="shifting"
            @click="startShift"
          >
            Начать смену
          </UButton>
          <UButton
            v-else
            color="neutral"
            icon="i-lucide-square"
            :loading="shifting"
            variant="outline"
            @click="endShift"
          >
            Завершить смену
          </UButton>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div v-if="pendingTransfers.length" class="space-y-3">
          <div
            v-for="transfer in pendingTransfers"
            :key="transfer.id"
            class="rounded-[1.5rem] border border-warning-300 bg-warning-50 p-4 shadow-sm"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <div class="flex items-center gap-2 text-sm font-semibold text-warning-900">
                  <UIcon name="i-lucide-bell-ring" class="size-5 shrink-0" />
                  Вам передали клиента
                </div>
                <p class="mt-2 text-sm text-warning-900">
                  {{ transfer.client_name || 'Клиент' }} · от {{ transfer.from_barber_name || 'другого барбера' }}
                </p>
                <p class="mt-1 text-xs text-warning-800">
                  Подтвердите передачу, чтобы клиент появился в вашей активной очереди.
                </p>
              </div>
              <div class="flex shrink-0 gap-2">
                <UButton
                  color="primary"
                  size="sm"
                  :loading="transferRespondingId === String(transfer.id) && transferRespondingDecision === 'accept'"
                  :disabled="!!transferRespondingId"
                  @click="respondToTransfer(transfer, 'accept')"
                >
                  Принять
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  size="sm"
                  :loading="transferRespondingId === String(transfer.id) && transferRespondingDecision === 'reject'"
                  :disabled="!!transferRespondingId"
                  @click="respondToTransfer(transfer, 'reject')"
                >
                  Отклонить
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          <DashboardMetricCard
            description="Текущие активные записи для авторизованного барбера."
            icon="i-lucide-clock-3"
            label="Элементы очереди"
            :value="data?.queue?.count || 0"
          />
          <DashboardMetricCard
            description="Контекст филиала, назначенный барберу."
            icon="i-lucide-map-pinned"
            label="Филиал"
            :value="sessionStore.barber?.branch_id || 'Неизвестно'"
          />
          <DashboardMetricCard
            description="Дополнительный индикатор нагрузки из состава киоска."
            icon="i-lucide-users-round"
            label="Текущие клиенты"
            :value="sessionStore.barber?.current_clients || 0"
          />
          <DashboardMetricCard
            description="Оценка времени ожидания по данным бэкенда."
            icon="i-lucide-timer"
            label="Оценка ожидания"
            :value="`${sessionStore.barber?.estimated_waiting_time || 0} мин`"
          />
        </div>

        <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
            <template #header>
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Профиль
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  {{ sessionStore.user?.name || 'Сессия барбера' }}
                </h2>
              </div>
            </template>

            <div class="space-y-5">
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500">Логин</p>
                  <p class="mt-2 text-lg font-semibold text-charcoal-950">{{ sessionStore.user?.login || 'Не указан' }}</p>
                </div>
                <div class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500">Специализация</p>
                  <p class="mt-2 text-lg font-semibold text-charcoal-950">{{ sessionStore.barber?.specialization || 'Общие услуги' }}</p>
                </div>
              </div>

              <div class="space-y-3 rounded-[1.5rem] border border-charcoal-200 bg-white/80 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500">Управление сменой</p>
                <div class="flex flex-wrap gap-3">
                  <UButton
                    v-if="!sessionStore.barber?.is_on_shift"
                    color="primary"
                    icon="i-lucide-play"
                    :loading="shifting"
                    @click="startShift"
                  >
                    Начать смену
                  </UButton>
                  <UButton
                    v-else
                    color="neutral"
                    icon="i-lucide-square"
                    :loading="shifting"
                    variant="outline"
                    @click="endShift"
                  >
                    Завершить смену
                  </UButton>
                </div>
              </div>

              <div class="space-y-3 rounded-[1.5rem] border border-charcoal-200 bg-white/80 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500">Управление перерывом</p>
                <div class="flex flex-wrap items-end gap-3">
                  <UFormField label="Минуты" name="minutes">
                    <UInput v-model="breakMinutes" min="1" type="number" />
                  </UFormField>
                  <UButton icon="i-lucide-coffee" @click="startBreak">
                    Начать перерыв
                  </UButton>
                  <UButton color="neutral" icon="i-lucide-undo-2" variant="outline" @click="returnFromBreak">
                    Вернуться
                  </UButton>
                </div>
              </div>

              <UAlert
                color="neutral"
                description="Обновления очереди, вызовы клиентов и изменения киоска повторно подтягиваются по событиям Socket.IO queue:update от бэкенда."
                icon="i-lucide-radio-tower"
                title="Синхронизация очереди в реальном времени"
                variant="soft"
              />
            </div>
          </UCard>

          <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
            <template #header>
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Активная очередь
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  Управляйте текущей очередью
                </h2>
              </div>
            </template>

            <div v-if="data?.queue?.items?.length">
              <QueueTable
                :items="queueItems"
                :loading="pending"
                @call="callItem"
                @complete="completeItem"
                @open="openItem"
                @start="startItem"
              />
            </div>
            <SharedEmptyState
              v-else
              description="Для авторизованного барбера не найдено активных записей очереди."
              icon="i-lucide-sofa"
              title="Очередь пуста"
            />
          </UCard>
        </div>
      </div>

      <QueueCompletePaymentModal
        v-model:open="paymentModalOpen"
        :amount="completingAmount"
        :loading="completing"
        title="Завершить заказ"
        @submit="submitComplete"
      />
    </template>
  </UDashboardPanel>
</template>
