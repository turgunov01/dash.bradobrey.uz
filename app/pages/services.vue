<script setup lang="ts">
import { serviceFormSchema, type ServiceCategory, type ServiceFormPayload } from '~~/shared/schemas'
import { formatMoney } from '~/utils/format'
import { flattenServicesPayload } from '~/utils/services'
import { resolveApiMediaUrl } from '~/utils/mediaUrl'

const apiClient = useApiClient()
const config = useRuntimeConfig()

const Draggable = defineAsyncComponent({
  loader: () => import('vuedraggable').then(module => module.default),
  suspensible: false
})

type ServiceRow = {
  base_price: number
  category: string
  duration_minutes: number
  id: string
  image: string | null
  is_active: boolean
  name: string
  sort_order: number | null
}

type Bucket = {
  name: string
  items: ServiceRow[]
}

type CategoryRow = {
  id: string
  name: string
  sort_order: string | number | null
  is_active: boolean | null
}

type CategoryOption = { label: string, value: string }

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

const servicesApi = useServicesApi()
const categoriesApi = useServiceCategoriesApi()
const branchStore = useBranchStore()

await branchStore.ensureLoaded()

const serviceModalOpen = ref(false)
const previewOpen = ref(false)
const previewSrc = ref('')
const previewTitle = ref('')

const sortDirection = ref<'saved' | 'asc' | 'desc'>('saved')
const savingOrder = ref(false)
const buckets = ref<Bucket[]>([])
const ready = ref(false)

const form = reactive({
  category_name: '',
  duration: 30,
  id: '',
  is_active: true,
  image: '',
  name: '',
  price: 0
})

const imageFile = ref<File | null>(null)
const objectUrl = ref('')
const previewUrl = computed(() => objectUrl.value || resolveServiceImageUrl(form.image) || '')

const { data, pending, refresh } = await useAsyncData('services-dashboard', async () => {
  return await servicesApi.list()
}, {
  watch: [() => branchStore.activeBranchId]
})

const { data: categoriesData, pending: categoriesPending, refresh: refreshCategories, error: categoriesError } = await useAsyncData(
  'service-categories-dashboard',
  async () => {
    if (!branchStore.activeBranchId) {
      return { items: [], total: 0 }
    }

    return await categoriesApi.list(true)
  },
  {
    watch: [() => branchStore.activeBranchId]
  }
)

const serviceRows = computed<ServiceRow[]>(() =>
  flattenServicesPayload(data.value).map((service, index) => ({
    base_price: Number(service.base_price ?? service.price ?? 0),
    category: service.category?.trim() || 'Без категории',
    duration_minutes: Number(service.duration_minutes ?? service.duration ?? 0),
    id: String(service.id ?? `service-${index}`),
    image: service.image ? String(service.image).trim() : null,
    is_active: Boolean(service.is_active ?? true),
    name: service.name?.trim() || 'Услуга без названия',
    sort_order: service.sort_order == null ? null : Number(service.sort_order)
  }))
)

const categoryRows = computed<CategoryRow[]>(() =>
  ((categoriesData.value as any)?.items || []).flatMap((item: ServiceCategory) => {
    const id = normalizeText(item?.id)
    const name = normalizeText(item?.name || item?.title)
    if (!id || !name) return []

    return [{
      id,
      is_active: item.is_active ?? null,
      name,
      sort_order: item.sort_order ?? null
    }]
  })
)

const categoryOptions = computed<CategoryOption[]>(() =>
  categoryRows.value.map((item) => {
    const order = normalizeText(item.sort_order)
    return {
      label: order ? `${order}. ${item.name}` : item.name,
      value: item.name
    }
  })
)

const canCreateService = computed(() => categoryOptions.value.length > 0)

const categoriesErrorMessage = computed(() => {
  const error: any = categoriesError.value
  const payload = error?.data || error?.response?._data

  if (typeof payload === 'string') return payload
  if (payload?.message) return payload.message
  if (error?.statusMessage) return error.statusMessage
  if (error?.message) return error.message

  return null
})

async function refreshAll() {
  await Promise.all([refresh(), refreshCategories()])
}

watch([serviceRows, categoryRows], ([rows]) => {
  if (ready.value) {
    syncBuckets(rows)
  }
}, { immediate: true })

watch(sortDirection, () => {
  buckets.value = buckets.value.map(bucket => ({
    ...bucket,
    items: applySortAndOrder(bucket.items, bucket.name)
  }))
})

onMounted(() => {
  ready.value = true
  syncBuckets(serviceRows.value)
})

const totalServices = computed(() => serviceRows.value.length)
const modalTitle = computed(() => form.id ? 'Обновить услугу' : 'Создать услугу')
const modalDescription = computed(() => form.id ? 'Измените параметры и сохраните' : 'Заполните данные, чтобы добавить услугу')

function resolveServiceImageUrl(value: unknown) {
  return resolveApiMediaUrl(value, config.public.apiBase)
}

function applySortAndOrder(list: ServiceRow[], _category: string) {
  return [...list].sort((a, b) => {
    if (sortDirection.value === 'saved') {
      return (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER)
    }
    return sortDirection.value === 'asc'
      ? a.name.localeCompare(b.name, 'ru')
      : b.name.localeCompare(a.name, 'ru')
  })
}

function syncBuckets(rows: ServiceRow[]) {
  const map = new Map<string, ServiceRow[]>()
  for (const row of rows) {
    const key = row.category || 'Без категории'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push({ ...row })
  }

  const orderedCategoryNames = categoryRows.value.map(category => category.name)
  const legacyNames = Array.from(map.keys())
    .filter(name => !orderedCategoryNames.includes(name))
    .sort((a, b) => a.localeCompare(b, 'ru'))
  const names = [...orderedCategoryNames, ...legacyNames]

  const next: Bucket[] = []

  for (const name of names) {
    const items = applySortAndOrder(map.get(name) || [], name)
    if (items.length || orderedCategoryNames.includes(name)) {
      next.push({ name, items })
    }
  }

  buckets.value = next
}

async function persistAllOrders() {
  if (savingOrder.value) return
  savingOrder.value = true
  const items = buckets.value.flatMap(bucket => bucket.items.map((item, index) => ({
    id: item.id,
    category: bucket.name === 'Без категории' ? null : bucket.name,
    sort_order: index
  })))
  try {
    await servicesApi.reorder(items)
    for (const bucket of buckets.value) {
      bucket.items.forEach((item, index) => { item.sort_order = index })
    }
    sortDirection.value = 'saved'
    await refresh()
  } catch (error) {
    console.error('Failed to save service order', error)
  } finally {
    savingOrder.value = false
  }
}

function moveService(bucket: Bucket, index: number, direction: -1 | 1) {
  const target = index + direction
  if (savingOrder.value || pending.value || target < 0 || target >= bucket.items.length) return
  const [item] = bucket.items.splice(index, 1)
  if (item) bucket.items.splice(target, 0, item)
}

function onDragChange(category: string, evt: any) {
  if (evt.added?.element) evt.added.element.category = category
}

watch(serviceModalOpen, (open) => {
  if (!open) resetForm()
})

function resetForm() {
  form.category_name = ''
  form.duration = 30
  form.id = ''
  form.is_active = true
  form.image = ''
  form.name = ''
  form.price = 0
  imageFile.value = null
  if (objectUrl.value) {
    globalThis.URL?.revokeObjectURL(objectUrl.value)
    objectUrl.value = ''
  }
}

function openCreateModal() {
  if (!canCreateService.value) {
    apiClient.notifyError(new Error('categories are required'), 'Сначала создайте хотя бы одну категорию.')
    return
  }

  resetForm()
  serviceModalOpen.value = true
}

function startEdit(service: ServiceRow) {
  form.category_name = service.category
  form.duration = Number(service.duration_minutes || 0)
  form.id = String(service.id)
  form.is_active = Boolean(service.is_active ?? true)
  form.image = service.image || ''
  form.name = service.name || ''
  form.price = Number(service.base_price || 0)
  imageFile.value = null
  if (objectUrl.value) {
    globalThis.URL?.revokeObjectURL(objectUrl.value)
    objectUrl.value = ''
  }
  serviceModalOpen.value = true
}

function handleImageInput(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (objectUrl.value) {
    globalThis.URL?.revokeObjectURL(objectUrl.value)
  }
  objectUrl.value = globalThis.URL?.createObjectURL(file) || ''
  imageFile.value = file
}

function buildServiceFormData(payload: ServiceFormPayload) {
  const formData = new FormData()

  formData.append('name', payload.name)

  if (payload.category_name) {
    formData.append('category', payload.category_name)
  }

  if (payload.price !== undefined && payload.price !== null) {
    formData.append('base_price', String(payload.price))
  }

  if (payload.duration !== undefined && payload.duration !== null) {
    formData.append('duration_minutes', String(payload.duration))
  }

  if (payload.image) {
    formData.append('image', payload.image)
  }

  if (payload.is_active !== undefined && payload.is_active !== null) {
    formData.append('is_active', payload.is_active ? 'true' : 'false')
  }

  if (imageFile.value) {
    formData.append('file', imageFile.value)
  }

  return formData
}

async function submit() {
  const categoryName = normalizeText(form.category_name)

  if (!categoryName) {
    apiClient.notifyError(new Error('category is required'), 'Выберите категорию.')
    return
  }

  const payload = serviceFormSchema.safeParse({
    category_name: categoryName,
    duration: form.duration,
    image: form.image || undefined,
    is_active: form.is_active,
    name: form.name,
    price: form.price
  })

  if (!payload.success) {
    apiClient.notifyError(new Error(payload.error.issues[0]?.message || 'Проверьте данные'))
    return
  }

  const body = imageFile.value ? buildServiceFormData(payload.data) : payload.data

  if (form.id) {
    await servicesApi.update(form.id, body)
  } else {
    await servicesApi.create(body)
  }
  await refresh()
  serviceModalOpen.value = false
}

async function removeService(id: string) {
  await servicesApi.remove(id, branchStore.activeBranchId
    ? {
        branch_id: branchStore.activeBranchId,
        object_id: branchStore.activeBranchId
      }
    : undefined
  )
  await refresh()
}

function openPreview(src: string, title: string) {
  previewSrc.value = resolveServiceImageUrl(src) || src
  previewTitle.value = title
  previewOpen.value = true
}
</script>

<template>
  <UDashboardPanel id="services">
    <template #header>
      <UDashboardNavbar title="Услуги">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4">
        <UBadge color="neutral" size="lg" variant="soft">
          {{ totalServices }} услуг
        </UBadge>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <USelect
            v-model="sortDirection"
            :disabled="savingOrder"
            :items="[
              { label: 'Сохранённый порядок', value: 'saved' },
              { label: 'A → Я', value: 'asc' },
              { label: 'Я → A', value: 'desc' }
            ]"
            size="sm" portal="body" />
          <UButton color="success" icon="i-lucide-save" variant="solid" :loading="savingOrder" :disabled="pending || categoriesPending || !totalServices" @click="persistAllOrders">
            Сохранить порядок услуг
          </UButton>
          <UButton color="neutral" icon="i-lucide-folder" variant="outline" to="/service-categories">
            Категории
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" :disabled="!canCreateService" @click="openCreateModal">
            Добавить услугу
          </UButton>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending || categoriesPending" variant="outline" @click="refreshAll()">
            Обновить
          </UButton>
        </div>
      </div>

      <p class="pb-4 text-sm text-charcoal-500">
        Меняйте порядок стрелками или перетаскивайте услуги. Нажмите «Сохранить порядок услуг» — киоск получит его при следующей загрузке списка.
      </p>

      <div v-if="!categoriesPending && (categoriesError || !canCreateService)" class="pb-4">
        <UAlert
          color="error"
          icon="i-lucide-triangle-alert"
          variant="soft"
          :title="categoriesError ? 'Категории не загружены' : 'Категории не созданы'"
          :description="categoriesError ? (categoriesErrorMessage || 'Не удалось загрузить категории.') : 'Чтобы создать услугу, сначала создайте хотя бы одну категорию.'"
        />
      </div>

      <div
        v-if="ready && buckets.length"
        class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <template v-for="bucket in buckets" :key="bucket.name">
          <div
            class="rounded-2xl border border-charcoal-200 bg-white/90 p-3"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-semibold text-charcoal-950">{{ bucket.name }}</h3>
              </div>
              <UBadge color="neutral" variant="soft">{{ bucket.items.length }}</UBadge>
            </div>

            <ClientOnly>
              <Draggable
                v-model="bucket.items"
                :disabled="savingOrder || pending"
                :group="{ name: 'services', pull: true, put: true }"
                item-key="id"
                handle=".drag-handle"
                class="min-h-12 space-y-2"
                ghost-class="opacity-60"
                :data-category="bucket.name"
                @change="onDragChange(bucket.name, $event)"
              >
                <template #item="{ element, index }">
                  <div class="rounded-xl border border-charcoal-200 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <div class="flex items-start justify-between gap-3 p-3">
                      <div class="space-y-1">
                        <p class="font-semibold text-charcoal-950">{{ index + 1 }}. {{ element.name }}</p>
                        <p class="text-xs text-charcoal-500">
                          {{ element.duration_minutes }} мин · {{ formatMoney(element.base_price) }}
                        </p>
                        <p class="text-xs text-charcoal-400">ID: {{ element.id }}</p>
                      </div>
                      <div class="flex items-center gap-1">
                        <UButton
                          icon="i-lucide-arrow-up"
                          aria-label="Переместить услугу выше"
                          title="Выше"
                          variant="ghost"
                          size="xs"
                          :disabled="index === 0 || savingOrder || pending"
                          @click.stop="moveService(bucket, index, -1)"
                        />
                        <UButton
                          icon="i-lucide-arrow-down"
                          aria-label="Переместить услугу ниже"
                          title="Ниже"
                          variant="ghost"
                          size="xs"
                          :disabled="index === bucket.items.length - 1 || savingOrder || pending"
                          @click.stop="moveService(bucket, index, 1)"
                        />
                        <UButton
                          aria-label="Перетащить услугу"
                          icon="i-lucide-grip-vertical"
                          variant="ghost"
                          size="xs"
                          class="drag-handle cursor-grab"
                        />
                      </div>
                    </div>

                    <div class="flex items-center justify-end gap-2 border-t border-charcoal-100 px-3 py-2">
                      <UButton
                        v-if="element.image"
                        icon="i-lucide-image"
                        variant="ghost"
                        size="xs"
                        @click.stop="openPreview(element.image!, element.name)"
                      />
                      <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click.stop="startEdit(element)" />
                      <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click.stop="removeService(element.id)" />
                    </div>
                  </div>
                </template>
              </Draggable>
            </ClientOnly>
          </div>
        </template>
      </div>

      <SharedEmptyState
        v-else-if="ready"
        description="Список услуг пуст или не был получен от бэкенда."
        icon="i-lucide-badge-dollar-sign"
        title="Услуги не загружены"
      />

      <div v-else class="flex justify-center py-8">
        <UProgress class="max-w-64" />
      </div>

      <UModal
        v-model:open="serviceModalOpen"
        class="sm:max-w-xl"
        :description="modalDescription"
        :title="modalTitle"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Название услуги">
              <UInput v-model="form.name" />
            </UFormField>

            <UFormField label="Категория">
              <USelectMenu
                v-model="form.category_name"
                class="w-full"
                :items="categoryOptions"
                placeholder="Выберите категорию"
                value-key="value" portal="body" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Длительность (мин)">
                <UInput v-model="form.duration" type="number" />
              </UFormField>

              <UFormField label="Цена">
                <UInput v-model="form.price" type="number" />
              </UFormField>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Ссылка на картинку">
                <UInput v-model="form.image" placeholder="https://..." />
              </UFormField>

              <UFormField label="Или загрузите файл">
                <UInput
                  accept="image/*"
                  type="file"
                  @change="handleImageInput"
                />
              </UFormField>
            </div>

            <div v-if="previewUrl" class="rounded-xl border border-charcoal-200 bg-white/70 p-3">
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-500">
                Предпросмотр
              </p>
              <img
                :alt="form.name || 'Превью услуги'"
                :src="previewUrl"
                class="max-h-64 w-full rounded-lg object-contain"
              >
            </div>

            <UCheckbox v-model="form.is_active" label="Услуга активна" />
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex w-full flex-wrap justify-end gap-3">
            <UButton color="neutral" variant="outline" @click="resetForm">
              Сбросить
            </UButton>
            <UButton color="neutral" variant="ghost" @click="close">
              Закрыть
            </UButton>
            <UButton color="primary" icon="i-lucide-save" @click="submit">
              {{ form.id ? 'Обновить услугу' : 'Создать услугу' }}
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>

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
