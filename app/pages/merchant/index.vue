<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { formatDateTime, formatMoney } from '~/utils/format'
import type { MerchantQueueEntry } from '~/composables/useMerchantApi'

definePageMeta({
  layout: 'merchant'
})

const apiClient = useApiClient()

type ActiveOrderRow = {
  id: string
  branch: string
  customer: string
  status: string | null
  amount: string | number | null
  created_at: string | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function toActiveOrderRow(value: MerchantQueueEntry): ActiveOrderRow {
  const id = normalizeText(value?.id) || ''
  const branch = normalizeText((value as any)?.branches?.name) || normalizeText((value as any)?.branch?.name) || '—'
  const customer = normalizeText((value as any)?.customer_name) || normalizeText((value as any)?.phone_number) || '—'

  return {
    amount: (value as any)?.amount ?? null,
    branch,
    created_at: (value as any)?.created_at ?? null,
    customer,
    id,
    status: (value as any)?.status ?? null
  }
}

const merchantApi = useMerchantApi()
const editBarbershopOpen = ref(false)
const submittingBarbershop = ref(false)

const barbershopForm = reactive({
  address: '',
  city: '',
  cover_url: '',
  description: '',
  logo_url: '',
  name: '',
  timezone: 'Asia/Tashkent'
})

const { data, pending, refresh } = await useAsyncData('merchant-dashboard', async () => {
  const dashboard = await merchantApi.dashboard()
  const barbershop = await $fetch(`/api/marketplace/catalog/barbershops/${dashboard.barbershop_id}`).catch(() => null)

  return {
    barbershop,
    dashboard
  }
})

const dashboard = computed(() => (data.value as any)?.dashboard as Awaited<ReturnType<typeof merchantApi.dashboard>> | null)
const barbershop = computed(() => {
  const value = (data.value as any)?.barbershop as any
  return value?.item ?? value?.entry ?? value
})

const barbershopName = computed(() => normalizeText(barbershop.value?.name) || 'Барбершоп')
const barbershopCity = computed(() => normalizeText(barbershop.value?.city))

const activeRows = computed<ActiveOrderRow[]>(() => {
  const items = (dashboard.value as any)?.active_orders?.items
  return Array.isArray(items) ? items.map(toActiveOrderRow) : []
})

const columns: TableColumn<ActiveOrderRow>[] = [
  { accessorKey: 'customer', header: 'Клиент' },
  { accessorKey: 'branch', header: 'Филиал' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'created_at', header: 'Создано' },
  { accessorKey: 'amount', header: 'Сумма' }
]

function openEditBarbershop() {
  const source = barbershop.value || {}

  barbershopForm.name = normalizeText(source.name) || ''
  barbershopForm.city = normalizeText(source.city) || ''
  barbershopForm.address = normalizeText(source.address) || ''
  barbershopForm.timezone = normalizeText(source.timezone) || 'Asia/Tashkent'
  barbershopForm.description = normalizeText(source.description) || ''
  barbershopForm.logo_url = normalizeText(source.logo_url) || ''
  barbershopForm.cover_url = normalizeText(source.cover_url) || ''
  editBarbershopOpen.value = true
}

async function submitBarbershopEdit() {
  const name = normalizeText(barbershopForm.name)

  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Укажите название барбершопа.')
    return
  }

  submittingBarbershop.value = true
  try {
    await merchantApi.updateBarbershop({
      address: normalizeText(barbershopForm.address),
      city: normalizeText(barbershopForm.city),
      cover_url: normalizeText(barbershopForm.cover_url),
      description: normalizeText(barbershopForm.description),
      logo_url: normalizeText(barbershopForm.logo_url),
      name,
      timezone: normalizeText(barbershopForm.timezone)
    })

    editBarbershopOpen.value = false
    await refresh()
  }
  finally {
    submittingBarbershop.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="merchant-home">
    <template #header>
      <UDashboardNavbar title="Главная" :ui="{ right: 'gap-3' }">
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
                  {{ barbershopName }}
                </h2>
                <p class="text-sm text-charcoal-500">
                  {{ barbershopCity ? `Город: ${barbershopCity}` : 'Город не указан' }}
                </p>
              </div>

              <UButton color="neutral" icon="i-lucide-pencil" variant="outline" @click="openEditBarbershop">
                Редактировать
              </UButton>
            </div>
          </template>

          <div class="grid gap-4 md:grid-cols-3">
            <DashboardMetricCard
              description="Количество филиалов вашего барбершопа в маркетплейсе."
              icon="i-lucide-store"
              label="Филиалы"
              :value="String(dashboard?.counts?.branches ?? 0)"
            />
            <DashboardMetricCard
              description="Открытые заявки/заказы (ожидает/в работе)."
              icon="i-lucide-list-checks"
              label="Активные"
              :value="String(dashboard?.counts?.active_orders ?? 0)"
            />
            <DashboardMetricCard
              description="Завершено сегодня и выручка по завершённым."
              icon="i-lucide-chart-column"
              label="Сегодня"
              :value="`${dashboard?.today?.completed ?? 0} / ${formatMoney(dashboard?.today?.revenue ?? 0)}`"
            />
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <DashboardMetricCard
              description="Барберы, созданные в кабинете мерчанта (только ваши)."
              icon="i-lucide-scissors"
              label="Барберы"
              :value="String(dashboard?.counts?.barbers ?? 0)"
            />
            <DashboardMetricCard
              description="Услуги, созданные в кабинете мерчанта (только ваши)."
              icon="i-lucide-tags"
              label="Услуги"
              :value="String(dashboard?.counts?.services ?? 0)"
            />
          </div>

          <div class="mt-6 flex flex-wrap gap-2">
            <UButton color="neutral" variant="outline" icon="i-lucide-building-2" to="/merchant/branches">
              Филиалы
            </UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-scissors" to="/merchant/barbers">
              Барберы
            </UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-folder" to="/merchant/categories">
              Категории
            </UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-tags" to="/merchant/services">
              Услуги
            </UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-history" to="/merchant/history">
              История
            </UButton>
          </div>
        </UCard>

        <UModal
          v-model:open="editBarbershopOpen"
          class="sm:max-w-2xl"
          title="Редактировать барбершоп"
          description="Эти данные отображаются в карточке вашего барбершопа."
        >
          <template #body>
            <div class="space-y-4">
              <UFormField label="Название" required>
                <UInput v-model="barbershopForm.name" />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Город">
                  <UInput v-model="barbershopForm.city" placeholder="Ташкент" />
                </UFormField>

                <UFormField label="Timezone">
                  <UInput v-model="barbershopForm.timezone" placeholder="Asia/Tashkent" />
                </UFormField>
              </div>

              <UFormField label="Адрес">
                <UInput v-model="barbershopForm.address" />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Лого URL">
                  <UInput v-model="barbershopForm.logo_url" placeholder="https://..." />
                </UFormField>

                <UFormField label="Обложка URL">
                  <UInput v-model="barbershopForm.cover_url" placeholder="https://..." />
                </UFormField>
              </div>

              <UFormField label="Описание">
                <UTextarea v-model="barbershopForm.description" :rows="3" />
              </UFormField>
            </div>
          </template>

          <template #footer="{ close }">
            <div class="flex w-full flex-wrap justify-end gap-3">
              <UButton color="neutral" variant="ghost" :disabled="submittingBarbershop" @click="close">
                Закрыть
              </UButton>
              <UButton color="primary" icon="i-lucide-save" :loading="submittingBarbershop" @click="submitBarbershopEdit">
                Сохранить
              </UButton>
            </div>
          </template>
        </UModal>

        <UCard class="warm-card">
          <template #header>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-1">
                <h3 class="barbershop-heading text-xl text-charcoal-950">
                  Активные заказы / заявки
                </h3>
                <p class="text-sm text-charcoal-500">
                  Только активные статусы: waiting / called / started / in_progress.
                </p>
              </div>

              <UBadge color="neutral" size="lg" variant="soft">
                {{ activeRows.length }} шт.
              </UBadge>
            </div>
          </template>

          <div
            v-if="activeRows.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="columns" :data="activeRows">
              <template #status-cell="{ row }">
                <SharedStatusBadge :label="row.original.status" />
              </template>
              <template #created_at-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.created_at ? formatDateTime(row.original.created_at) : '—' }}
                </span>
              </template>
              <template #amount-cell="{ row }">
                <span class="text-sm font-medium text-charcoal-950">
                  {{ row.original.amount !== null && row.original.amount !== undefined ? formatMoney(row.original.amount) : '—' }}
                </span>
              </template>
            </UTable>
          </div>

          <div v-else class="py-10 text-center text-sm text-charcoal-500">
            Активных заявок нет.
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
