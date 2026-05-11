<script setup lang="ts">
import type { AccordionItem, TableColumn } from '@nuxt/ui'

import { formatDateTime, formatMoney } from '~/utils/format'

type BarberRow = {
  id: string
  name: string
  is_on_shift: boolean | null
  queue_count: number | null
  estimated_waiting_time: number | null
}

type ServiceRow = {
  id: string
  name: string
  category: string | null
  duration_minutes: number | null
  base_price: number | null
}

type SlotRow = {
  starts_at: string
  ends_at: string
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function asNumber(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function toBarberRow(value: unknown): BarberRow | null {
  if (!value || typeof value !== 'object') return null
  const anyValue = value as any
  const id = normalizeText(anyValue.id)
  if (!id) return null

  return {
    estimated_waiting_time: asNumber(anyValue.estimated_waiting_time),
    id,
    is_on_shift: anyValue.is_on_shift === undefined || anyValue.is_on_shift === null ? null : Boolean(anyValue.is_on_shift),
    name: normalizeText(anyValue.name) || 'Барбер',
    queue_count: asNumber(anyValue.queue_count)
  }
}

function toServiceRow(value: unknown): ServiceRow | null {
  if (!value || typeof value !== 'object') return null
  const anyValue = value as any
  const id = normalizeText(anyValue.id)
  if (!id) return null

  return {
    base_price: asNumber(anyValue.base_price),
    category: normalizeText(anyValue.category),
    duration_minutes: asNumber(anyValue.duration_minutes),
    id,
    name: normalizeText(anyValue.name) || 'Услуга'
  }
}

function toSlotRow(value: unknown): SlotRow | null {
  if (!value || typeof value !== 'object') return null
  const anyValue = value as any
  const starts = normalizeText(anyValue.starts_at)
  const ends = normalizeText(anyValue.ends_at)
  if (!starts || !ends) return null
  return { ends_at: ends, starts_at: starts }
}

const route = useRoute()
const store = useDashboardMarketplaceStore()

const branchId = computed(() => String(route.params.id || ''))

const { pending, refresh } = await useAsyncData(
  () => `dashboard-marketplace-branch-${branchId.value}`,
  async () => {
    const id = branchId.value
    if (!id) return null

    store.availability = null
    store.availabilityError = null
    store.availabilityStatus = 'idle'

    await store.fetchBranch(id)
    return true
  },
  { watch: [branchId] }
)

const details = computed<any>(() => store.selectedBranch as any)
const branch = computed<any>(() => details.value?.branch ?? null)
const barbersRaw = computed<unknown[]>(() => Array.isArray(details.value?.barbers) ? details.value.barbers : [])
const servicesRaw = computed<unknown[]>(() => Array.isArray(details.value?.services) ? details.value.services : [])
const categories = computed<any[]>(() => Array.isArray(details.value?.categories) ? details.value.categories : [])

const barbers = computed<BarberRow[]>(() =>
  barbersRaw.value.flatMap(item => {
    const row = toBarberRow(item)
    return row ? [row] : []
  })
)

const services = computed<ServiceRow[]>(() =>
  servicesRaw.value.flatMap(item => {
    const row = toServiceRow(item)
    return row ? [row] : []
  })
)

const barberColumns: TableColumn<BarberRow>[] = [
  { accessorKey: 'name', header: 'Барбер' },
  { id: 'shift', header: 'Смена' },
  { accessorKey: 'queue_count', header: 'Очередь' },
  { accessorKey: 'estimated_waiting_time', header: 'Ожидание (мин)' }
]

const serviceColumns: TableColumn<ServiceRow>[] = [
  { accessorKey: 'name', header: 'Услуга' },
  { accessorKey: 'category', header: 'Категория' },
  { accessorKey: 'duration_minutes', header: 'Длительность' },
  { accessorKey: 'base_price', header: 'Цена' }
]

const slotColumns: TableColumn<SlotRow>[] = [
  { accessorKey: 'starts_at', header: 'Начало' },
  { accessorKey: 'ends_at', header: 'Конец' }
]

const selectedBarberId = ref<string>('')
const selectedServiceIds = ref<string[]>([])

watchEffect(() => {
  if (!selectedBarberId.value && barbers.value.length) {
    selectedBarberId.value = barbers.value[0]!.id
  }
})

const barberAccordionItems = computed<AccordionItem[]>(() =>
  barbers.value.map((barber) => ({
    icon: 'i-lucide-user',
    label: barber.name,
    content: ''
  }))
)

const availabilitySlots = computed<SlotRow[]>(() => {
  const items = (store.availability as any)?.items
  if (!Array.isArray(items)) return []

  return items.flatMap((item: unknown) => {
    const row = toSlotRow(item)
    return row ? [row] : []
  })
})

const availabilityMeta = computed<any>(() => store.availability as any)

async function loadAvailability() {
  if (!branchId.value || !selectedBarberId.value) return

  await store.fetchAvailability(branchId.value, {
    barber_id: selectedBarberId.value,
    ...(selectedServiceIds.value.length ? { service_ids: selectedServiceIds.value } : {})
  })
}

function clearAvailability() {
  store.availability = null
  store.availabilityStatus = 'idle'
  store.availabilityError = null
}
</script>

<template>
  <UDashboardPanel id="marketplace-branch">
    <template #header>
      <UDashboardNavbar :title="branch?.name || 'Филиал'" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="neutral"
            icon="i-lucide-arrow-left"
            variant="outline"
            to="/dashboard/marketplace"
          >
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
        <UCard class="warm-card">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="space-y-2">
              <h2 class="barbershop-heading text-2xl text-charcoal-950">
                {{ branch?.name || 'Филиал' }}
              </h2>
              <p class="text-sm text-charcoal-500">
                ID: <span class="font-mono">{{ branchId }}</span>
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <UBadge color="neutral" size="lg" variant="soft">
                {{ barbers.length }} барберов
              </UBadge>
              <UBadge color="neutral" size="lg" variant="soft">
                {{ services.length }} услуг
              </UBadge>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="rounded-2xl border border-charcoal-200 bg-white/70 p-4">
              <p class="text-xs text-charcoal-500">
                Город
              </p>
              <p class="text-sm font-medium text-charcoal-950">
                {{ branch?.city || '—' }}
              </p>
            </div>

            <div class="rounded-2xl border border-charcoal-200 bg-white/70 p-4">
              <p class="text-xs text-charcoal-500">
                Адрес
              </p>
              <p class="text-sm font-medium text-charcoal-950">
                {{ branch?.address || '—' }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-1">
              <h3 class="barbershop-heading text-xl text-charcoal-950">
                Барберы
              </h3>
              <p class="text-sm text-charcoal-500">
                Список барберов филиала и их текущая загрузка (по очереди).
              </p>
            </div>
          </template>

          <div
            v-if="barbers.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="barberColumns" :data="barbers">
              <template #name-cell="{ row }">
                <div class="space-y-1">
                  <span class="font-medium text-charcoal-950">{{ row.original.name }}</span>
                  <p class="text-xs text-charcoal-500">
                    {{ row.original.id }}
                  </p>
                </div>
              </template>

              <template #shift-cell="{ row }">
                <UBadge
                  v-if="row.original.is_on_shift !== null"
                  :color="row.original.is_on_shift ? 'success' : 'neutral'"
                  variant="soft"
                >
                  {{ row.original.is_on_shift ? 'На смене' : 'Не на смене' }}
                </UBadge>
                <span v-else class="text-sm text-charcoal-500">—</span>
              </template>

              <template #queue_count-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.queue_count ?? '—' }}
                </span>
              </template>

              <template #estimated_waiting_time-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.estimated_waiting_time ?? '—' }}
                </span>
              </template>
            </UTable>
          </div>

          <SharedEmptyState
            v-else-if="!pending"
            title="Пусто"
            description="Барберы не найдены или не удалось загрузить список."
            icon="i-lucide-users"
          />

          <div v-else class="flex justify-center py-8">
            <ULoader size="lg" />
          </div>
        </UCard>

        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-1">
              <h3 class="barbershop-heading text-xl text-charcoal-950">
                Услуги (по барберу)
              </h3>
              <p class="text-sm text-charcoal-500">
                Представление для ревью. Сейчас услуги берутся на уровне филиала и отображаются под каждым барбером.
              </p>
            </div>
          </template>

          <div v-if="barbers.length && services.length" class="space-y-4">
            <UAccordion :items="barberAccordionItems">
              <template #body>
                <div
                  class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
                >
                  <UTable :columns="serviceColumns" :data="services">
                    <template #name-cell="{ row }">
                      <div class="space-y-1">
                        <span class="font-medium text-charcoal-950">{{ row.original.name }}</span>
                        <p class="text-xs text-charcoal-500">
                          {{ row.original.id }}
                        </p>
                      </div>
                    </template>

                    <template #category-cell="{ row }">
                      <span class="text-sm text-charcoal-700">
                        {{ row.original.category || '—' }}
                      </span>
                    </template>

                    <template #duration_minutes-cell="{ row }">
                      <span class="text-sm text-charcoal-700">
                        {{ row.original.duration_minutes ? `${row.original.duration_minutes} мин` : '—' }}
                      </span>
                    </template>

                    <template #base_price-cell="{ row }">
                      <span class="text-sm font-medium text-charcoal-950">
                        {{ row.original.base_price !== null ? formatMoney(row.original.base_price) : '—' }}
                      </span>
                    </template>
                  </UTable>
                </div>
              </template>
            </UAccordion>

            <div v-if="categories.length" class="rounded-2xl border border-charcoal-200 bg-white/70 p-4">
              <p class="text-xs text-charcoal-500">
                Категории
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
                <UBadge v-for="cat in categories" :key="cat.category" color="neutral" variant="soft">
                  {{ cat.category }}
                </UBadge>
              </div>
            </div>
          </div>

          <SharedEmptyState
            v-else-if="!pending"
            title="Пусто"
            description="Нет данных по барберам или услугам для выбранного филиала."
            icon="i-lucide-badge-dollar-sign"
          />

          <div v-else class="flex justify-center py-8">
            <ULoader size="lg" />
          </div>
        </UCard>

        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-1">
              <h3 class="barbershop-heading text-xl text-charcoal-950">
                Доступность (только чтение)
              </h3>
              <p class="text-sm text-charcoal-500">
                Слоты на сегодня. Данные не используются для записи из админ-панели.
              </p>
            </div>
          </template>

          <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div class="space-y-2">
                <p class="text-xs text-charcoal-500">
                  Барбер
                </p>
                <USelect
                  v-model="selectedBarberId"
                  class="w-full sm:w-72"
                  :items="barbers.map(b => ({ label: b.name, value: b.id }))"
                />
              </div>

              <div class="space-y-2">
                <p class="text-xs text-charcoal-500">
                  Услуги (опционально)
                </p>
                <USelect
                  v-model="selectedServiceIds"
                  multiple
                  class="w-full sm:w-96"
                  :items="services.map(s => ({ label: s.name, value: s.id }))"
                />
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                color="primary"
                icon="i-lucide-calendar-search"
                :disabled="!selectedBarberId"
                :loading="store.availabilityStatus === 'loading'"
                @click="loadAvailability"
              >
                Показать
              </UButton>

              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-x"
                :disabled="store.availabilityStatus === 'loading'"
                @click="clearAvailability"
              >
                Очистить
              </UButton>
            </div>
          </div>

          <div v-if="store.availabilityError" class="mt-4">
            <UAlert color="error" variant="soft" title="Ошибка" :description="store.availabilityError" />
          </div>

          <div v-if="store.availabilityStatus === 'loaded'" class="mt-4 space-y-4">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge color="neutral" variant="soft">
                {{ availabilitySlots.length }} слотов
              </UBadge>
              <UBadge v-if="availabilityMeta?.schedule?.start_time" color="neutral" variant="soft">
                График: {{ availabilityMeta.schedule.start_time }}–{{ availabilityMeta.schedule.end_time }}
              </UBadge>
              <UBadge v-if="availabilityMeta?.interval_minutes" color="neutral" variant="soft">
                Интервал: {{ availabilityMeta.interval_minutes }} мин
              </UBadge>
              <UBadge v-if="availabilityMeta?.duration_minutes" color="neutral" variant="soft">
                Длительность: {{ availabilityMeta.duration_minutes }} мин
              </UBadge>
            </div>

            <div
              v-if="availabilitySlots.length"
              class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
            >
              <UTable :columns="slotColumns" :data="availabilitySlots">
                <template #starts_at-cell="{ row }">
                  <span class="text-sm text-charcoal-700">
                    {{ formatDateTime(row.original.starts_at) }}
                  </span>
                </template>

                <template #ends_at-cell="{ row }">
                  <span class="text-sm text-charcoal-700">
                    {{ formatDateTime(row.original.ends_at) }}
                  </span>
                </template>
              </UTable>
            </div>

            <SharedEmptyState
              v-else
              title="Нет слотов"
              description="На сегодня свободных слотов нет или график не настроен."
              icon="i-lucide-calendar-x"
            />
          </div>

          <div v-else-if="store.availabilityStatus === 'loading'" class="mt-6 flex justify-center py-8">
            <ULoader size="lg" />
          </div>

          <SharedEmptyState
            v-else
            class="mt-6"
            title="Данные не загружены"
            description="Выберите барбера и нажмите «Показать», чтобы увидеть слоты на сегодня."
            icon="i-lucide-calendar-search"
          />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
