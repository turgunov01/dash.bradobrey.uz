<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { promoCodeSchema, promoCreateSchema } from '~~/shared/schemas'
import { formatCount, formatDateTime } from '~/utils/format'

type PromoDiscountType = 'percentage' | 'fixed'
type PromoStatus = 'active' | 'inactive'

type PromoFormState = {
  code: string
  discount_type: PromoDiscountType
  discount_value: number
  is_unlimited: boolean
  status: PromoStatus
  usage_limit: number | null
}

type PromoRow = {
  code: string
  createdAt: string | null
  discountLabel: string
  discountType: PromoDiscountType
  discountValue: number
  id: string
  isUnlimited: boolean
  remaining: number | null
  status: PromoStatus
  usageLimit: number | null
  usedCount: number
}

const promoApi = usePromoApi()
const apiClient = useApiClient()
const branchStore = useBranchStore()

await branchStore.ensureLoaded()

const discountTypeOptions: Array<{ label: string, value: PromoDiscountType }> = [
  { label: 'Процент', value: 'percentage' },
  { label: 'Фиксированная сумма', value: 'fixed' }
]

const statusOptions: Array<{ label: string, value: PromoStatus }> = [
  { label: 'Активный', value: 'active' },
  { label: 'Неактивный', value: 'inactive' }
]

function createDefaultPromoForm(): PromoFormState {
  return {
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    is_unlimited: false,
    status: 'active',
    usage_limit: 1
  }
}

function normalizeDiscountType(value: unknown): PromoDiscountType {
  return String(value || '').toLowerCase() === 'fixed' ? 'fixed' : 'percentage'
}

function normalizeStatus(value: unknown, fallback = false): PromoStatus {
  if (String(value || '').toLowerCase() === 'active') {
    return 'active'
  }

  if (value === true || fallback) {
    return 'active'
  }

  return 'inactive'
}

function normalizeNumber(value: unknown, fallback = 0) {
  const amount = Number(value)

  return Number.isFinite(amount) ? amount : fallback
}

function normalizeNullableNumber(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const amount = Number(value)

  return Number.isFinite(amount) ? amount : null
}

function buildDiscountLabel(type: PromoDiscountType, value: number, fallback?: string | null) {
  if (fallback) {
    return fallback
  }

  if (type === 'percentage') {
    return `${formatCount(value)}%`
  }

  return formatCount(value)
}

function toPromoRow(item: unknown, index: number): PromoRow {
  const parsed = promoCodeSchema.safeParse(item)
  const source = (parsed.success ? parsed.data : item) as Record<string, any>
  const usedCount = normalizeNumber(source.used_count ?? source.usage_count)
  const isUnlimited = Boolean(source.is_unlimited ?? false)
  const usageLimit = normalizeNullableNumber(source.usage_limit)
  const discountType = normalizeDiscountType(source.discount_type)
  const discountValue = normalizeNumber(source.discount_value)
  const remaining = isUnlimited
    ? null
    : normalizeNullableNumber(source.remaining) ?? Math.max((usageLimit || 0) - usedCount, 0)

  return {
    code: String(source.code || 'Без кода'),
    createdAt: source.created_at ? String(source.created_at) : null,
    discountLabel: buildDiscountLabel(discountType, discountValue, source.discount ? String(source.discount) : null),
    discountType,
    discountValue,
    id: String(source.id ?? `promo-${index}`),
    isUnlimited,
    remaining,
    status: normalizeStatus(source.status, Boolean(source.is_active)),
    usageLimit,
    usedCount
  }
}

function isPromoActive(row: PromoRow) {
  return row.status === 'active' && (row.isUnlimited || (row.remaining ?? 0) > 0)
}

const createForm = reactive<PromoFormState>(createDefaultPromoForm())
const editForm = reactive<PromoFormState & { id: string }>({
  ...createDefaultPromoForm(),
  id: ''
})

const createModalOpen = ref(false)
const editModalOpen = ref(false)
const removingId = ref('')

const promoColumns: TableColumn<PromoRow>[] = [
  { accessorKey: 'code', header: 'КОД' },
  { id: 'discount', header: 'СКИДКА' },
  { id: 'usage', header: 'ИСПОЛЬЗОВАНИЯ' },
  { id: 'status', header: 'СТАТУС' },
  { accessorKey: 'createdAt', header: 'СОЗДАН' },
  { id: 'actions', header: '' }
]

const { data, pending, refresh } = await useAsyncData('promo-dashboard', async () => {
  const dashboard = await promoApi.dashboard()
  const rawItems: unknown[] = Array.isArray((dashboard as any)?.items)
    ? (dashboard as any).items
    : Array.isArray(dashboard)
      ? (dashboard as any[])
      : []

  const items = rawItems
    .map((item: unknown, index: number) => toPromoRow(item, index))
    .sort((left: PromoRow, right: PromoRow) => right.code.localeCompare(left.code, 'ru'))

  return {
    items
  }
}, {
  watch: [() => branchStore.activeBranchId]
})

const promoRows = computed<PromoRow[]>(() => data.value?.items || [])
const activePromoRows = computed<PromoRow[]>(() => promoRows.value.filter(isPromoActive))

watch(
  () => createForm.is_unlimited,
  (isUnlimited) => {
    if (isUnlimited) {
      createForm.usage_limit = null
      return
    }

    if (!createForm.usage_limit) {
      createForm.usage_limit = 1
    }
  },
  { immediate: true }
)

watch(
  () => editForm.is_unlimited,
  (isUnlimited) => {
    if (isUnlimited) {
      editForm.usage_limit = null
      return
    }

    if (!editForm.usage_limit) {
      editForm.usage_limit = 1
    }
  },
  { immediate: true }
)

watch(createModalOpen, (open) => {
  if (!open) {
    resetCreateForm()
  }
})

watch(editModalOpen, (open) => {
  if (!open) {
    resetEditForm()
  }
})

function resetCreateForm() {
  Object.assign(createForm, createDefaultPromoForm())
}

function resetEditForm() {
  Object.assign(editForm, {
    ...createDefaultPromoForm(),
    id: ''
  })
}

function openCreateModal() {
  resetCreateForm()
  createModalOpen.value = true
}

function startEdit(row: PromoRow) {
  Object.assign(editForm, {
    code: row.code,
    discount_type: row.discountType,
    discount_value: row.discountValue,
    id: row.id,
    is_unlimited: row.isUnlimited,
    status: row.status,
    usage_limit: row.isUnlimited ? null : (row.usageLimit || 1)
  })

  editModalOpen.value = true
}

function validatePromoForm(form: PromoFormState) {
  const payload = promoCreateSchema.safeParse({
    code: form.code,
    discount_type: form.discount_type,
    discount_value: form.discount_value,
    is_unlimited: form.is_unlimited,
    status: form.status,
    usage_limit: form.is_unlimited ? null : form.usage_limit
  })

  if (!payload.success) {
    apiClient.notifyError(new Error(payload.error.issues[0]?.message || 'Некорректные данные промокода'))
    return null
  }

  return payload.data
}

async function createPromo() {
  const payload = validatePromoForm(createForm)

  if (!payload) {
    return
  }

  await promoApi.create(payload)
  resetCreateForm()
  await refresh()
  createModalOpen.value = false
}

async function savePromo() {
  const payload = validatePromoForm(editForm)

  if (!payload || !editForm.id) {
    return
  }

  await promoApi.update(editForm.id, payload)
  await refresh()
  editModalOpen.value = false
}

async function removePromo(row: PromoRow) {
  const message = row.usedCount
    ? `Удалить промокод ${row.code} вместе с историей его использований?`
    : `Удалить промокод ${row.code}?`

  if (import.meta.client && !window.confirm(message)) {
    return
  }

  removingId.value = row.id

  try {
    await promoApi.remove(row.id)
    await refresh()

    if (editForm.id === row.id) {
      editModalOpen.value = false
    }
  }
  finally {
    removingId.value = ''
  }
}
</script>

<template>
  <UDashboardPanel id="promo">
    <template #header>
      <UDashboardNavbar title="Промокоды" :ui="{ right: 'gap-3' }">
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
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <template #header>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Панель
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  Действующие промокоды
                </h2>
              </div>

              <div class="flex flex-wrap items-center justify-end gap-3">
                <UButton color="primary" icon="i-lucide-plus" @click="openCreateModal">
                  Создать
                </UButton>

                <UBadge color="neutral" size="lg" variant="soft">
                  {{ activePromoRows.length }} действующих
                </UBadge>
              </div>
            </div>
          </template>

          <div v-if="activePromoRows.length" class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
            <UTable
              :columns="promoColumns"
              :data="activePromoRows"
              :loading="pending"
              sticky="header"
              :ui="{
                root: 'w-full max-h-[42rem] overflow-auto',
                base: 'w-full min-w-[72rem]',
                thead: 'bg-charcoal-50/90',
                tbody: 'divide-y divide-charcoal-100',
                th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
                td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
              }"
            >
              <template #code-cell="{ row }">
                <div class="space-y-1">
                  <p class="font-semibold text-charcoal-950">
                    {{ row.original.code }}
                  </p>
                  <p class="text-xs text-charcoal-500">
                    {{ row.original.isUnlimited ? 'Без лимита' : 'Ограниченный промокод' }}
                  </p>
                </div>
              </template>

              <template #discount-cell="{ row }">
                <div class="space-y-1">
                  <p class="font-medium text-charcoal-950">
                    {{ row.original.discountLabel }}
                  </p>
                  <p class="text-xs text-charcoal-500">
                    {{ row.original.discountType === 'percentage' ? 'Процентная скидка' : 'Фиксированная скидка' }}
                  </p>
                </div>
              </template>

              <template #usage-cell="{ row }">
                <div class="space-y-1">
                  <p class="font-medium text-charcoal-950">
                    {{ formatCount(row.original.usedCount) }}
                    <span v-if="!row.original.isUnlimited"> / {{ formatCount(row.original.usageLimit) }}</span>
                  </p>
                  <p class="text-xs text-charcoal-500">
                    {{ row.original.isUnlimited ? 'Лимит не ограничен' : `Осталось ${formatCount(row.original.remaining)}` }}
                  </p>
                </div>
              </template>

              <template #status-cell="{ row }">
                <SharedStatusBadge :label="row.original.status" />
              </template>

              <template #createdAt-cell="{ row }">
                {{ formatDateTime(row.original.createdAt) }}
              </template>

              <template #actions-cell="{ row }">
                <div class="flex justify-end gap-2">
                  <UTooltip text="Редактировать">
                    <UButton
                      aria-label="Редактировать промокод"
                      color="neutral"
                      icon="i-lucide-pencil"
                      square
                      variant="ghost"
                      @click="startEdit(row.original)"
                    />
                  </UTooltip>

                  <UTooltip text="Удалить">
                    <UButton
                      :aria-label="`Удалить промокод ${row.original.code}`"
                      color="error"
                      icon="i-lucide-trash-2"
                      :loading="removingId === row.original.id"
                      square
                      variant="ghost"
                      @click="removePromo(row.original)"
                    />
                  </UTooltip>
                </div>
              </template>
            </UTable>
          </div>

          <SharedEmptyState
            v-else
            description="В списке нет ни одного действующего промокода."
            icon="i-lucide-ticket-percent"
            title="Действующих промокодов нет"
          />
        </UCard>
      </div>

      <UModal
        v-model:open="createModalOpen"
        class="sm:max-w-xl"
        description="Задайте параметры нового промокода."
        title="Создать промокод"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Код">
              <UInput v-model="createForm.code" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Тип скидки">
                <USelectMenu v-model="createForm.discount_type" :items="discountTypeOptions" value-key="value" portal="body" />
              </UFormField>

              <UFormField label="Статус">
                <USelectMenu v-model="createForm.status" :items="statusOptions" value-key="value" portal="body" />
              </UFormField>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Размер скидки">
                <UInput v-model="createForm.discount_value" type="number" />
              </UFormField>

              <UFormField label="Лимит использований">
                <UInput v-model="createForm.usage_limit" :disabled="createForm.is_unlimited" type="number" />
              </UFormField>
            </div>

            <UCheckbox v-model="createForm.is_unlimited" label="Безлимитный промокод" />
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex w-full flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="outline" @click="resetCreateForm">
              Сбросить
            </UButton>
            <UButton color="neutral" variant="ghost" @click="close">
              Закрыть
            </UButton>
            <UButton color="primary" icon="i-lucide-plus" @click="createPromo">
              Создать промокод
            </UButton>
          </div>
        </template>
      </UModal>

      <UModal
        v-model:open="editModalOpen"
        class="sm:max-w-xl"
        description="Обновите параметры выбранного промокода."
        title="Редактировать промокод"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Код">
              <UInput v-model="editForm.code" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Тип скидки">
                <USelectMenu v-model="editForm.discount_type" :items="discountTypeOptions" value-key="value" portal="body" />
              </UFormField>

              <UFormField label="Статус">
                <USelectMenu v-model="editForm.status" :items="statusOptions" value-key="value" portal="body" />
              </UFormField>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Размер скидки">
                <UInput v-model="editForm.discount_value" type="number" />
              </UFormField>

              <UFormField label="Лимит использований">
                <UInput v-model="editForm.usage_limit" :disabled="editForm.is_unlimited" type="number" />
              </UFormField>
            </div>

            <UCheckbox v-model="editForm.is_unlimited" label="Безлимитный промокод" />
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex w-full flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="outline" @click="resetEditForm">
              Сбросить
            </UButton>
            <UButton color="neutral" variant="ghost" @click="close">
              Закрыть
            </UButton>
            <UButton color="primary" icon="i-lucide-save" @click="savePromo">
              Сохранить изменения
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
