<script setup lang="ts">
import Draggable from 'vuedraggable'
import { useStorage } from '@vueuse/core'
import { serviceFormSchema } from '~~/shared/schemas'
import { formatMoney } from '~/utils/format'
import { flattenServicesPayload } from '~/utils/services'

type ServiceRow = {
  base_price: number
  category: string
  duration_minutes: number
  id: string
  image: string | null
  is_active: boolean
  name: string
}

type Bucket = {
  name: string
  items: ServiceRow[]
}

const servicesApi = useServicesApi()
const branchStore = useBranchStore()

await branchStore.ensureLoaded()

const serviceModalOpen = ref(false)
const previewOpen = ref(false)
const previewSrc = ref('')
const previewTitle = ref('')

const sortDirection = ref<'asc' | 'desc'>('asc')
const orderStorage = useStorage<Record<string, string[]>>('services-order', {}, undefined, {
  deep: true,
  listenToStorageChanges: false
})
const categoryOrder = useStorage<string[]>('services-category-order', [], undefined, {
  deep: true,
  listenToStorageChanges: false
})
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
const previewUrl = computed(() => objectUrl.value || form.image || '')

const { data, pending, refresh } = await useAsyncData('services-dashboard', async () => {
  return await servicesApi.list()
}, {
  watch: [() => branchStore.activeBranchId]
})

const serviceRows = computed<ServiceRow[]>(() =>
  flattenServicesPayload(data.value).map((service, index) => ({
    base_price: Number(service.base_price ?? service.price ?? 0),
    category: service.category?.trim() || 'Без категории',
    duration_minutes: Number(service.duration_minutes ?? service.duration ?? 0),
    id: String(service.id ?? `service-${index}`),
    image: service.image ? String(service.image).trim() : null,
    is_active: Boolean(service.is_active ?? true),
    name: service.name?.trim() || 'Услуга без названия'
  }))
)

watch(serviceRows, (rows) => {
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

function applySortAndOrder(list: ServiceRow[], category: string, preferredOrder?: string[]) {
  const ordered = [...list].sort((a, b) =>
    sortDirection.value === 'asc'
      ? a.name.localeCompare(b.name, 'ru')
      : b.name.localeCompare(a.name, 'ru')
  )

  const saved = preferredOrder && preferredOrder.length
    ? preferredOrder
    : orderStorage.value?.[category]
  if (saved?.length) {
    const indexMap = new Map(saved.map((id, idx) => [id, idx]))
    ordered.sort((a, b) => {
      const ai = indexMap.get(a.id)
      const bi = indexMap.get(b.id)
      if (ai !== undefined && bi !== undefined) return ai - bi
      if (ai !== undefined) return -1
      if (bi !== undefined) return 1
      return sortDirection.value === 'asc'
        ? a.name.localeCompare(b.name, 'ru')
        : b.name.localeCompare(a.name, 'ru')
    })
  }

  return ordered
}

function syncBuckets(rows: ServiceRow[]) {
  const map = new Map<string, ServiceRow[]>()
  for (const row of rows) {
    const key = row.category || 'Без категории'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push({ ...row })
  }

  const storedOrder = categoryOrder.value || []
  const names = Array.from(map.keys()).sort((a, b) => {
    const ai = storedOrder.indexOf(a)
    const bi = storedOrder.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.localeCompare(b, 'ru')
  })

  const next: Bucket[] = []

  for (const name of names) {
    const existing = buckets.value.find(b => b.name === name)
    const preferredOrder = ready.value
      ? (existing?.items.map(i => i.id) || orderStorage.value?.[name] || [])
      : (existing?.items.map(i => i.id) || [])
    const items = applySortAndOrder(map.get(name) || [], name, preferredOrder)
    next.push({ name, items })
  }

  buckets.value = next

  // ensure category order stored
  if (ready.value) {
    categoryOrder.value = next.map(b => b.name)
  }
}

function saveOrder(category: string) {
  const bucket = buckets.value.find(b => b.name === category)
  if (!bucket) return

  orderStorage.value = {
    ...(orderStorage.value || {}),
    [category]: bucket.items.map(item => item.id)
  }
}

function persistAllOrders() {
  for (const bucket of buckets.value) {
    orderStorage.value = {
      ...(orderStorage.value || {}),
      [bucket.name]: bucket.items.map(item => item.id)
    }
  }
  categoryOrder.value = buckets.value.map(b => b.name)
  useApiClient().notifySuccess('Порядок сохранён')
}

async function onDragChange(category: string, evt: any) {
  if (evt.added?.element) {
    evt.added.element.category = category
  }
  if (evt.moved?.element) {
    evt.moved.element.category = category
  }

  saveOrder(category)

  const fromCategory = evt?.from?.dataset?.category
  if (fromCategory && fromCategory !== category) {
    saveOrder(fromCategory)
  }

  const element = evt.added?.element ?? evt.moved?.element
  const source = fromCategory || category
  if (element && source !== category) {
    try {
      await servicesApi.update(element.id, {
        category_name: category,
        name: element.name,
        price: element.base_price,
        duration: element.duration_minutes,
        image: element.image || undefined,
        is_active: element.is_active
      })
    } catch (error) {
      console.error('Failed to update category', error)
      useApiClient().notifyError(new Error('Не удалось сохранить новую категорию'))
    }
  }
}

function persistCategoryOrder() {
  categoryOrder.value = buckets.value.map(b => b.name)
  useApiClient().notifySuccess('Порядок категорий сохранён')
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

async function submit() {
  const payload = serviceFormSchema.safeParse({
    category_name: form.category_name || undefined,
    duration: form.duration,
    image: form.image || undefined,
    is_active: form.is_active,
    name: form.name,
    price: form.price
  })

  if (!payload.success) {
    useApiClient().notifyError(new Error(payload.error.issues[0]?.message || 'Проверьте данные'))
    return
  }

  if (form.id) {
    await servicesApi.update(form.id, payload.data)
  } else {
    await servicesApi.create(payload.data)
  }
  await refresh()
  serviceModalOpen.value = false
}

async function removeService(id: string) {
  await servicesApi.remove(id)
  await refresh()
}

function openPreview(src: string, title: string) {
  previewSrc.value = src
  previewTitle.value = title
  previewOpen.value = true
}
</script>

<template>
  <UDashboardPanel id="services">
    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4">
        <UBadge color="neutral" size="lg" variant="soft">
          {{ totalServices }} услуг
        </UBadge>

        <div class="flex items-center gap-2">
          <USelect
            v-model="sortDirection"
            :options="[
              { label: 'A → Я', value: 'asc' },
              { label: 'Я → A', value: 'desc' }
            ]"
            option-attribute="label"
            value-attribute="value"
            size="sm"
          />
          <UButton color="success" icon="i-lucide-save" variant="solid" @click="persistAllOrders">
            Сохранить порядок
          </UButton>
          <UButton color="primary" icon="i-lucide-plus" @click="openCreateModal">
            Добавить услугу
          </UButton>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
        </div>
      </div>

      <Draggable
        v-if="ready && buckets.length"
        v-model="buckets"
        item-key="name"
        class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        :group="{ name: 'categories', pull: false, put: false }"
        handle=".category-drag-handle"
        ghost-class="opacity-60"
        @change="persistCategoryOrder"
      >
        <template #item="{ element: bucket }">
          <div
            class="rounded-2xl border border-charcoal-200 bg-white/90 p-3"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <UButton
                  icon="i-lucide-grip-vertical"
                  variant="ghost"
                  size="xs"
                  class="category-drag-handle cursor-grab"
                />
                <h3 class="text-lg font-semibold text-charcoal-950">{{ bucket.name }}</h3>
              </div>
              <UBadge color="neutral" variant="soft">{{ bucket.items.length }}</UBadge>
            </div>

            <Draggable
              v-model="bucket.items"
              :group="{ name: 'services', pull: true, put: true }"
              item-key="id"
              handle=".drag-handle"
              class="space-y-2"
              ghost-class="opacity-60"
              :data-category="bucket.name"
              @change="onDragChange(bucket.name, $event)"
            >
              <template #item="{ element }">
                <div class="rounded-xl border border-charcoal-200 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                  <div class="flex items-start justify-between gap-3 p-3">
                    <div class="space-y-1">
                      <p class="font-semibold text-charcoal-950">{{ element.name }}</p>
                      <p class="text-xs text-charcoal-500">
                        {{ element.duration_minutes }} мин · {{ formatMoney(element.base_price) }}
                      </p>
                      <p class="text-xs text-charcoal-400">ID: {{ element.id }}</p>
                    </div>
                    <div class="flex items-center gap-1">
                      <UButton
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
                      @click="openPreview(element.image!, element.name)"
                    />
                    <UButton icon="i-lucide-pencil" variant="ghost" size="xs" @click="startEdit(element)" />
                    <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="removeService(element.id)" />
                  </div>
                </div>
              </template>
            </Draggable>
          </div>
        </template>
      </Draggable>

      <SharedEmptyState
        v-else-if="ready"
        description="Список услуг пуст или не был получен от бэкенда."
        icon="i-lucide-badge-dollar-sign"
        title="Услуги не загружены"
      />

      <div v-else class="flex justify-center py-8">
        <ULoader size="lg" />
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
              <UInput v-model="form.category_name" placeholder="Стрижки, бритьё, окрашивание" />
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
