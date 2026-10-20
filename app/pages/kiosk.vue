<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui'

import { kioskBookingSchema, kioskRegisterSchema } from '~~/shared/schemas'
import { flattenServicesPayload } from '~/utils/services'

type KioskTab = 'barbers' | 'booking' | 'services'
type BarberRow = {
  barberId: string
  currentClients: number
  id: string
  name: string
  waitTime: number
}
type ServiceRow = {
  category: string
  duration: number
  id: string
  name: string
  price: string | number
  serviceId: string
}

const branchStore = useBranchStore()
const client = useApiClient()
const kioskApi = useKioskApi()

await branchStore.ensureLoaded()
useRealtimeQueue()

const activeTab = ref<KioskTab>('barbers')
const bookingForm = reactive({
  certificate_code: '',
  customer_name: '',
  payment_method: 'cash',
  phone_number: '',
  source: 'dashboard-kiosk'
})
const deviceName = ref('Планшет ресепшена')
const selectedBarberId = ref('')
const selectedServiceIds = ref<string[]>([])
const certificateCode = ref('')
const certificateResult = ref<unknown>(null)
const bookingPending = ref(false)

const baseTabs = [
  { label: 'Барберы', value: 'barbers' as KioskTab },
  { label: 'Услуги', value: 'services' as KioskTab },
  { label: 'Бронирование', value: 'booking' as KioskTab }
]

const { data, pending, refresh } = await useAsyncData('kiosk-dashboard', async () => {
  const branchId = branchStore.activeBranchId || undefined
  const [services, barbers] = await Promise.all([
    kioskApi.services({ active: true, grouped: true, ...(branchId ? { branch_id: branchId } : {}) }),
    branchId ? kioskApi.barbers(branchId) : Promise.resolve({ data: [] })
  ])

  return {
    barbers: Array.isArray((barbers as any)?.data) ? (barbers as any).data : [],
    services
  }
}, {
  lazy: true,
  watch: [() => branchStore.activeBranchId]
})

const isKioskInitialLoading = computed(() => pending.value && !data.value)

const allServices = computed(() => flattenServicesPayload(data.value?.services))

const barberRows = computed<BarberRow[]>(() =>
  (data.value?.barbers || []).map((barber: any, index: number) => ({
    barberId: barber.id !== undefined ? String(barber.id) : '',
    currentClients: barber.current_clients || 0,
    id: String(barber.id ?? barber.user_id ?? barber.name ?? `barber-${index}`),
    name: barber.name || barber.user?.name || 'Барбер без имени',
    waitTime: barber.estimated_waiting_time || 0
  }))
)

const hasBarbers = computed(() => barberRows.value.length > 0)

const tabs = computed(() =>
  baseTabs.map(tab =>
    tab.value === 'barbers'
      ? tab
      : { ...tab, disabled: !hasBarbers.value }
  )
)

const serviceRows = computed<ServiceRow[]>(() =>
  allServices.value.map((service: any, index: number) => ({
    category: service.category || service.category_name || 'Без категории',
    duration: Number(service.duration || 0),
    id: String(service.id ?? `service-${index}`),
    name: service.name || 'Услуга без названия',
    price: service.price ?? 0,
    serviceId: service.id !== undefined ? String(service.id) : ''
  }))
)

const barberColumns: TableColumn<BarberRow>[] = [
  { accessorKey: 'name', header: 'Барбер' },
  { accessorKey: 'currentClients', header: 'Клиенты' },
  { accessorKey: 'waitTime', header: 'Ожидание' },
  { id: 'action', header: '' }
]

const serviceColumns: TableColumn<ServiceRow>[] = [
  { accessorKey: 'category', header: 'Категория' },
  { accessorKey: 'name', header: 'Услуга' },
  { accessorKey: 'duration', header: 'Длительность' },
  { accessorKey: 'price', header: 'Цена' },
  { id: 'action', header: '' }
]

const selectedBarber = computed(() =>
  (data.value?.barbers || []).find((barber: any) => String(barber.id) === selectedBarberId.value) || null
)

const selectedServices = computed(() =>
  allServices.value.filter((service: any) => selectedServiceIds.value.includes(String(service.id)))
)

watch(
  barberRows,
  (rows) => {
    if (!rows.length) {
      selectedBarberId.value = ''
      return
    }

    if (!rows.some(row => row.barberId === selectedBarberId.value) && rows[0]?.barberId) {
      selectedBarberId.value = rows[0].barberId
    }
  },
  { immediate: true }
)

watch(
  hasBarbers,
  (value) => {
    if (!value && activeTab.value !== 'barbers') {
      activeTab.value = 'barbers'
    }
  },
  { immediate: true }
)

function selectBarber(barberId: string) {
  selectedBarberId.value = barberId
}

function toggleService(serviceId: string) {
  if (!serviceId) {
    return
  }

  if (selectedServiceIds.value.includes(serviceId)) {
    selectedServiceIds.value = selectedServiceIds.value.filter(id => id !== serviceId)
    return
  }

  selectedServiceIds.value = [...selectedServiceIds.value, serviceId]
}

function handleBarberSelect(_: Event, row: TableRow<BarberRow>) {
  if (!row.original.barberId) {
    return
  }

  selectBarber(row.original.barberId)
}

function handleServiceSelect(_: Event, row: TableRow<ServiceRow>) {
  if (!row.original.serviceId) {
    return
  }

  toggleService(row.original.serviceId)
}

async function registerDevice() {
  const payload = kioskRegisterSchema.safeParse({
    branch_id: branchStore.activeBranchId,
    device_name: deviceName.value
  })

  if (!payload.success) {
    client.notifyError(new Error(payload.error.issues[0]?.message || 'Некорректные данные регистрации киоска'))
    return
  }

  await kioskApi.register(payload.data)
}

async function lookupCertificate() {
  if (!certificateCode.value) {
    client.notifyError(new Error('Введите код сертификата'))
    return
  }

  certificateResult.value = await kioskApi.certificate(certificateCode.value)
}

async function createBooking() {
  const payload = kioskBookingSchema.safeParse({
    barber_id: selectedBarberId.value,
    branch_id: branchStore.activeBranchId,
    certificate_code: bookingForm.certificate_code || undefined,
    customer_name: bookingForm.customer_name,
    payment_method: bookingForm.payment_method || undefined,
    phone_number: bookingForm.phone_number,
    service_ids: selectedServiceIds.value,
    source: bookingForm.source
  })

  if (!payload.success) {
    client.notifyError(new Error(payload.error.issues[0]?.message || 'Некорректные данные записи через киоск'))
    return
  }

  bookingPending.value = true

  try {
    await kioskApi.book(payload.data)
    bookingForm.certificate_code = ''
    bookingForm.customer_name = ''
    bookingForm.phone_number = ''
    selectedServiceIds.value = []
    activeTab.value = 'barbers'
    await refresh()
  }
  finally {
    bookingPending.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="kiosk">
    <template #header>
      <UDashboardNavbar title="Симулятор киоска" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card rounded-[1.25rem] border border-charcoal-200">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                Активный филиал
              </p>
              <h2 class="barbershop-heading text-3xl text-charcoal-950">
                {{ branchStore.activeBranch?.name || 'Выберите филиал в боковой панели' }}
              </h2>
            </div>

            <div class="overflow-x-auto">
              <UTabs v-model="activeTab" :content="false" :items="tabs" :ui="{
                root: 'min-w-max items-start',
                list: 'inline-flex w-max rounded-[0.875rem] bg-charcoal-100 p-1.5',
                indicator: 'rounded-[0.75rem] bg-primary shadow-none',
                trigger: 'h-11 rounded-[0.75rem] px-4 text-sm font-semibold data-[state=active]:text-inverted sm:text-[15px]',
                label: 'whitespace-nowrap'
              }" />
            </div>
          </div>
        </UCard>

        <section v-if="activeTab === 'barbers'" class="space-y-4">
          <SharedSkeletonRows v-if="isKioskInitialLoading" :rows="5" :columns="4" />
          <div v-else-if="barberRows.length" class="overflow-hidden rounded-[1rem] border border-charcoal-200 bg-white/90">
            <UTable :columns="barberColumns" :data="barberRows" :get-row-id="(row) => row.id" :loading="pending" :meta="{
              class: {
                tr: (row) => row.original.barberId === selectedBarberId ? 'bg-primary/10 cursor-pointer' : 'cursor-pointer'
              }
            }" :on-select="handleBarberSelect" sticky="header" :ui="{
              root: 'max-h-[32rem] overflow-auto',
              base: 'min-w-[44rem]',
              thead: 'bg-charcoal-50/90',
              tbody: 'divide-y divide-charcoal-100 [&>tr]:data-[selectable=true]:hover:bg-charcoal-50/80',
              th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
              td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
            }">
              <template #name-cell="{ row }">
                <div>
                  <p class="font-medium text-charcoal-950">{{ row.original.name }}</p>
                  <p class="text-xs text-charcoal-500">
                    {{ row.original.barberId === selectedBarberId ? 'Выбранный барбер' : 'Нажмите, чтобы назначить' }}
                  </p>
                </div>
              </template>

              <template #waitTime-cell="{ row }">
                <span class="font-medium">{{ row.original.waitTime }} мин</span>
              </template>

              <template #action-cell="{ row }">
                <UButton :color="row.original.barberId === selectedBarberId ? 'primary' : 'neutral'"
                  :variant="row.original.barberId === selectedBarberId ? 'solid' : 'outline'" size="xs"
                  @click="selectBarber(row.original.barberId)">
                  {{ row.original.barberId === selectedBarberId ? 'Выбран' : 'Выбрать' }}
                </UButton>
              </template>
            </UTable>
          </div>
          <SharedEmptyState
            v-else
            description="Для текущего контекста филиала не получен список барберов."
            icon="i-lucide-scissors"
            title="Барберы недоступны"
          />
        </section>

        <section v-else-if="activeTab === 'services'" class="space-y-4">
          <SharedSkeletonRows v-if="isKioskInitialLoading" :rows="6" :columns="5" />
          <div v-else-if="serviceRows.length"
            class="overflow-hidden rounded-[1rem] border border-charcoal-200 bg-white/90">
            <UTable :columns="serviceColumns" :data="serviceRows" :get-row-id="(row) => row.id" :loading="pending"
              :meta="{
                class: {
                  tr: (row) => selectedServiceIds.includes(row.original.serviceId) ? 'bg-primary/10 cursor-pointer' : 'cursor-pointer'
                }
              }" :on-select="handleServiceSelect" sticky="header" :ui="{
                root: 'max-h-[36rem] overflow-auto',
                base: 'min-w-[56rem]',
                thead: 'bg-charcoal-50/90',
                tbody: 'divide-y divide-charcoal-100 [&>tr]:data-[selectable=true]:hover:bg-charcoal-50/80',
                th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
                td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
              }">
              <template #name-cell="{ row }">
                <div>
                  <p class="font-medium text-charcoal-950">{{ row.original.name }}</p>
                  <p class="text-xs text-charcoal-500">
                    {{ selectedServiceIds.includes(row.original.serviceId) ? 'Добавлено в запись' : 'Доступно для добавления' }}
                  </p>
                </div>
              </template>

              <template #duration-cell="{ row }">
                <span class="font-medium">{{ row.original.duration }} мин</span>
              </template>

              <template #action-cell="{ row }">
                <UButton :color="selectedServiceIds.includes(row.original.serviceId) ? 'primary' : 'neutral'"
                  :variant="selectedServiceIds.includes(row.original.serviceId) ? 'solid' : 'outline'" size="xs"
                  @click="toggleService(row.original.serviceId)">
                  {{ selectedServiceIds.includes(row.original.serviceId) ? 'Убрать' : 'Добавить' }}
                </UButton>
              </template>
            </UTable>
          </div>
          <SharedEmptyState
            v-else
            description="Бэкенд не вернул услуги для киоска."
            icon="i-lucide-badge-dollar-sign"
            title="Услуги недоступны"
          />
        </section>

        <section v-else class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <UCard class="warm-card rounded-[1.25rem] border border-charcoal-200">
            <template #header>
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Бронирование
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  Оформление записи через киоск
                </h2>
              </div>
            </template>

            <div class="space-y-4">
              <UFormField label="Имя клиента">
                <UInput v-model="bookingForm.customer_name" />
              </UFormField>
              <UFormField label="Телефон">
                <UInput v-model="bookingForm.phone_number" />
              </UFormField>
              <UFormField label="Способ оплаты">
                <UInput v-model="bookingForm.payment_method" />
              </UFormField>
              <UFormField label="Код сертификата">
                <UInput v-model="bookingForm.certificate_code" />
              </UFormField>

              <div class="flex justify-end">
                <UButton :loading="bookingPending" color="primary" icon="i-lucide-receipt" @click="createBooking">
                  Создать запись
                </UButton>
              </div>
            </div>
          </UCard>

          <div class="space-y-6">
            <UCard class="warm-card rounded-[1.25rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Сводка записи
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    Выбранный набор
                  </h2>
                </div>
              </template>

              <div class="space-y-3">
                <div class="rounded-[0.875rem] border border-charcoal-200 bg-white/80 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">Барбер</p>
                  <p class="mt-2 text-lg font-semibold text-charcoal-950">{{ selectedBarber?.name || 'Не выбран' }}</p>
                </div>
                <div class="rounded-[0.875rem] border border-charcoal-200 bg-white/80 p-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">Услуги</p>
                  <div v-if="selectedServices.length" class="mt-3 space-y-2">
                    <div v-for="service in selectedServices" :key="String(service.id)"
                      class="rounded-[0.75rem] bg-sand-100 px-3 py-2 text-sm text-charcoal-700">
                      {{ service.name }} / {{ service.duration || 0 }} мин / {{ service.price || 0 }}
                    </div>
                  </div>
                  <p v-else class="mt-2 text-sm text-charcoal-500">Услуги пока не выбраны.</p>
                </div>
              </div>
            </UCard>

            <UCard class="warm-card rounded-[1.25rem] border border-charcoal-200">
              <template #header>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Инструменты
                  </p>
                  <h2 class="barbershop-heading text-2xl text-charcoal-950">
                    Регистрация и поиск
                  </h2>
                </div>
              </template>

              <div class="space-y-4">
                <UFormField label="Имя устройства">
                  <UInput v-model="deviceName" />
                </UFormField>

                <UButton color="neutral" icon="i-lucide-tablet-smartphone" variant="outline" @click="registerDevice">
                  Зарегистрировать устройство киоска
                </UButton>

                <div class="soft-divider border-t pt-4">
                  <UFormField label="Поиск сертификата">
                    <UInput v-model="certificateCode" placeholder="Код сертификата" />
                  </UFormField>

                  <UButton class="mt-3" color="neutral" icon="i-lucide-search" variant="outline"
                    @click="lookupCertificate">
                    Найти сертификат
                  </UButton>
                </div>

                <SharedJsonBlock v-if="certificateResult" label="Ответ сертификата" :value="certificateResult" />
              </div>
            </UCard>
          </div>
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>
