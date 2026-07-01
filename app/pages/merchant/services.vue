<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { formatMoney } from '~/utils/format'
import type { MerchantService, MerchantServiceCategory, MerchantServicePayload } from '~/composables/useMerchantApi'
import { resolveApiMediaUrl } from '~/utils/mediaUrl'

const apiClient = useApiClient()
const config = useRuntimeConfig()

definePageMeta({
  layout: 'merchant'
})

type ServiceRow = {
  id: string
  name: string
  price: string | number | null
  duration_minutes: string | number | null
  category_name: string | null
  image: string | null
  is_active: boolean | null
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function resolveServiceImageUrl(value: unknown) {
  return resolveApiMediaUrl(value, config.public.apiBase)
}

function toRow(value: MerchantService): ServiceRow | null {
  const id = normalizeText(value?.id)
  if (!id) return null

  return {
    category_name: normalizeText(value.category_name),
    duration_minutes: (value as any).duration_minutes ?? null,
    id,
    image: normalizeText(value.image),
    is_active: value.is_active ?? null,
    name: normalizeText(value.name) || 'Услуга',
    price: (value as any).price ?? null
  }
}

const merchantApi = useMerchantApi()

const createOpen = ref(false)
const editOpen = ref(false)
const previewOpen = ref(false)
const previewSrc = ref('')
const previewTitle = ref('')
const submitting = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  category_name: '',
  duration_minutes: '',
  image: '',
  is_active: true,
  name: '',
  price: ''
})

function resetForm() {
  form.name = ''
  form.price = ''
  form.duration_minutes = ''
  form.category_name = ''
  form.image = ''
  form.is_active = true
}

function openCreate() {
  if (!canCreateService.value) {
    apiClient.notifyError(new Error('categories are required'), 'Сначала создайте хотя бы одну категорию.')
    return
  }

  editingId.value = null
  resetForm()
  createOpen.value = true
}

function openEdit(row: ServiceRow) {
  editingId.value = row.id
  form.name = row.name || ''
  form.price = row.price === null || row.price === undefined ? '' : String(row.price)
  form.duration_minutes = row.duration_minutes === null || row.duration_minutes === undefined ? '' : String(row.duration_minutes)
  form.category_name = row.category_name || ''
  form.image = row.image || ''
  form.is_active = row.is_active !== false
  editOpen.value = true
}

const { data, pending, refresh } = await useAsyncData('merchant-services', async () => {
  return await merchantApi.services(true)
})

const { data: categoriesData, pending: categoriesPending, refresh: refreshCategories, error: categoriesError } = await useAsyncData(
  'merchant-service-categories',
  async () => await merchantApi.categories(true),
  { server: false }
)

const rows = computed<ServiceRow[]>(() =>
  ((data.value as any)?.items || []).flatMap((item: MerchantService) => {
    const row = toRow(item)
    return row ? [row] : []
  })
)

type CategoryOption = { label: string, value: string }

const categoryOptions = computed<CategoryOption[]>(() =>
  ((categoriesData.value as any)?.items || []).flatMap((item: MerchantServiceCategory) => {
    const name = normalizeText(item?.name)
    if (!name) return []
    const order = normalizeText(item?.sort_order)
    return [{ label: order ? `${order}. ${name}` : name, value: name }]
  })
)

const canCreateService = computed(() => categoryOptions.value.length > 0)
const formImagePreviewSrc = computed(() => resolveServiceImageUrl(form.image))

const categoriesErrorMessage = computed(() => {
  const error: any = categoriesError.value
  const data = error?.data || error?.response?._data

  if (typeof data === 'string') return data
  if (data?.message) return data.message
  if (error?.statusMessage) return error.statusMessage
  if (error?.message) return error.message

  return null
})

async function refreshAll() {
  await Promise.all([refresh(), refreshCategories()])
}

const columns: TableColumn<ServiceRow>[] = [
  { accessorKey: 'name', header: 'Услуга' },
  { accessorKey: 'category_name', header: 'Категория' },
  { accessorKey: 'duration_minutes', header: 'Длительность' },
  { accessorKey: 'price', header: 'Цена' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: '' }
]

function toNumberOrNull(value: unknown) {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const text = String(value).trim()
  if (!text) return null

  const num = Number(text)
  return Number.isFinite(num) ? num : null
}

function toIntegerOrNull(value: unknown) {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null

  const text = String(value).trim()
  if (!text) return null

  const num = Number.parseInt(text, 10)
  return Number.isFinite(num) ? num : null
}

async function submitCreate() {
  const name = normalizeText(form.name)
  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Введите название услуги.')
    return
  }

  const category_name = normalizeText(form.category_name)
  if (!category_name) {
    apiClient.notifyError(new Error('category is required'), 'Выберите категорию.')
    return
  }

  submitting.value = true
  try {
    const payload: MerchantServicePayload = {
      category_name,
      duration_minutes: toIntegerOrNull(form.duration_minutes),
      image: normalizeText(form.image),
      is_active: Boolean(form.is_active),
      name,
      price: toNumberOrNull(form.price)
    }

    await merchantApi.createService(payload)
    createOpen.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

async function submitEdit() {
  const id = editingId.value
  if (!id) return

  const name = normalizeText(form.name)
  if (!name) {
    apiClient.notifyError(new Error('name is required'), 'Введите название услуги.')
    return
  }

  const category_name = normalizeText(form.category_name)
  if (!category_name) {
    apiClient.notifyError(new Error('category is required'), 'Выберите категорию.')
    return
  }

  submitting.value = true
  try {
    const payload: Partial<MerchantServicePayload> = {
      category_name,
      duration_minutes: toIntegerOrNull(form.duration_minutes),
      image: normalizeText(form.image),
      is_active: Boolean(form.is_active),
      name,
      price: toNumberOrNull(form.price)
    }

    await merchantApi.updateService(id, payload)
    editOpen.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

async function removeRow(row: ServiceRow) {
  if (import.meta.client && !window.confirm(`Удалить услугу «${row.name}»?`)) {
    return
  }

  submitting.value = true
  try {
    await merchantApi.deleteService(row.id)
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

function openPreview(row: ServiceRow) {
  const src = resolveServiceImageUrl(row.image)
  if (!src) return

  previewSrc.value = src
  previewTitle.value = row.name
  previewOpen.value = true
}
</script>

<template>
  <UDashboardPanel id="merchant-services">
    <template #header>
      <UDashboardNavbar title="Услуги" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="pending || categoriesPending"
            variant="outline"
            @click="refreshAll()"
          >
            Обновить
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" :disabled="!canCreateService" @click="openCreate">
            Добавить услугу
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div v-if="!categoriesPending && (categoriesError || !canCreateService)" class="space-y-3">
          <UAlert
            color="error"
            icon="i-lucide-triangle-alert"
            variant="soft"
            :title="categoriesError ? 'Категории не загружены' : 'Категории не созданы'"
            :description="categoriesError ? (categoriesErrorMessage || 'Не удалось загрузить категории.') : 'Чтобы создать услугу, сначала создайте хотя бы одну категорию.'"
          />

          <div class="flex flex-wrap gap-2">
            <UButton color="primary" icon="i-lucide-folder" to="/merchant/categories">
              Перейти в категории
            </UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="pending || categoriesPending" @click="refreshAll()">
              Повторить загрузку
            </UButton>
          </div>
        </div>

        <UCard class="warm-card">
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div class="space-y-1">
                <h2 class="barbershop-heading text-xl text-charcoal-950">
                  Услуги мерчанта
                </h2>
                <p class="text-sm text-charcoal-500">
                  Здесь показываются только услуги вашего барбершопа (не “главные” услуги системы).
                </p>
              </div>

              <UBadge color="neutral" size="lg" variant="soft">
                {{ rows.length }} шт.
              </UBadge>
            </div>
          </template>

          <div
            v-if="rows.length"
            class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90"
          >
            <UTable :columns="columns" :data="rows">
              <template #category_name-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.category_name || '—' }}
                </span>
              </template>

              <template #duration_minutes-cell="{ row }">
                <span class="text-sm text-charcoal-700">
                  {{ row.original.duration_minutes ? `${row.original.duration_minutes} мин` : '—' }}
                </span>
              </template>

              <template #price-cell="{ row }">
                <span class="text-sm font-medium text-charcoal-950">
                  {{ row.original.price !== null && row.original.price !== undefined ? formatMoney(row.original.price) : '—' }}
                </span>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  :color="row.original.is_active === false ? 'neutral' : 'success'"
                  size="xs"
                  variant="soft"
                >
                  {{ row.original.is_active === false ? 'Неактивна' : 'Активна' }}
                </UBadge>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    v-if="row.original.image"
                    icon="i-lucide-image"
                    variant="ghost"
                    size="xs"
                    @click="openPreview(row.original)"
                  />
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="openEdit(row.original)" />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :loading="submitting"
                    @click="removeRow(row.original)"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <div v-else class="py-10 text-center text-sm text-charcoal-500">
            Услуг пока нет.
          </div>
        </UCard>
      </div>

      <UModal
        v-model:open="createOpen"
        class="sm:max-w-xl"
        title="Новая услуга"
        description="Услуга будет создана только для вашего барбершопа."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="form.name" placeholder="Название услуги" />
            </UFormField>

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField label="Цена (сум)">
                <UInput v-model="form.price" type="number" placeholder="150000" />
              </UFormField>

              <UFormField label="Длительность (мин)">
                <UInput v-model="form.duration_minutes" type="number" placeholder="60" />
              </UFormField>
            </div>

            <UFormField label="Категория" required>
              <USelectMenu
                v-model="form.category_name"
                class="w-full"
                :items="categoryOptions"
                placeholder="Выберите категорию"
                value-key="value"
              />
            </UFormField>

            <UFormField label="Картинка (URL)">
              <UInput v-model="form.image" placeholder="https://..." />
            </UFormField>

            <div v-if="formImagePreviewSrc" class="rounded-xl border border-charcoal-200 bg-white/70 p-3">
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-500">
                Предпросмотр
              </p>
              <img
                :alt="form.name || 'Превью услуги'"
                :src="formImagePreviewSrc"
                class="max-h-64 w-full rounded-lg object-contain"
              >
            </div>

            <UFormField>
              <UCheckbox v-model="form.is_active" label="Активна" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="createOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" :loading="submitting" :disabled="!canCreateService" @click="submitCreate">
              Создать
            </UButton>
          </div>
        </template>
      </UModal>

      <UModal
        v-model:open="editOpen"
        class="sm:max-w-xl"
        title="Редактировать услугу"
        description="Изменения применяются только в кабинете мерчанта."
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название" required>
              <UInput v-model="form.name" placeholder="Название услуги" />
            </UFormField>

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField label="Цена (сум)">
                <UInput v-model="form.price" type="number" placeholder="150000" />
              </UFormField>

              <UFormField label="Длительность (мин)">
                <UInput v-model="form.duration_minutes" type="number" placeholder="60" />
              </UFormField>
            </div>

            <UFormField label="Категория" required>
              <USelectMenu
                v-model="form.category_name"
                class="w-full"
                :items="categoryOptions"
                placeholder="Выберите категорию"
                value-key="value"
              />
            </UFormField>

            <UFormField label="Картинка (URL)">
              <UInput v-model="form.image" placeholder="https://..." />
            </UFormField>

            <div v-if="formImagePreviewSrc" class="rounded-xl border border-charcoal-200 bg-white/70 p-3">
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-500">
                Предпросмотр
              </p>
              <img
                :alt="form.name || 'Превью услуги'"
                :src="formImagePreviewSrc"
                class="max-h-64 w-full rounded-lg object-contain"
              >
            </div>

            <UFormField>
              <UCheckbox v-model="form.is_active" label="Активна" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="submitting" @click="editOpen = false">
              Отмена
            </UButton>
            <UButton color="primary" :loading="submitting" @click="submitEdit">
              Сохранить
            </UButton>
          </div>
        </template>
      </UModal>

      <UModal
        v-model:open="previewOpen"
        class="sm:max-w-3xl"
        :title="previewTitle || 'Предпросмотр изображения'"
      >
        <template #body>
          <div class="flex justify-center">
            <img
              v-if="previewSrc"
              :alt="previewTitle || 'Превью услуги'"
              :src="previewSrc"
              class="max-h-[70vh] max-w-full rounded-2xl border border-charcoal-200 object-contain"
            >
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
