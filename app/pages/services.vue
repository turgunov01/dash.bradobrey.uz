<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

import { serviceFormSchema } from '~~/shared/schemas'
import { formatMoney } from '~/utils/format'
import { flattenServicesPayload } from '~/utils/services'

type ServiceRow = {
  base_price: number | string
  category: string
  duration_minutes: number
  id: string
  image: string | null
  is_active: boolean
  name: string
}

const servicesApi = useServicesApi()

const serviceModalOpen = ref(false)
const previewOpen = ref(false)
const previewSrc = ref('')
const previewTitle = ref('')
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
const servicePage = ref(1)
const servicePageSize = 10

const modalTitle = computed(() =>
  form.id ? 'Редактировать услугу' : 'Создать новую услугу'
)

const modalDescription = computed(() =>
  form.id
    ? 'Обновите данные выбранной услуги.'
    : 'Заполните форму, чтобы добавить услугу в каталог.'
)

const serviceColumns: TableColumn<ServiceRow>[] = [
  { accessorKey: 'name', header: 'name' },
  { accessorKey: 'category', header: 'category' },
  { accessorKey: 'duration_minutes', header: 'duration_minutes' },
  { accessorKey: 'base_price', header: 'base_price' },
  { accessorKey: 'image', header: 'image' },
  { accessorKey: 'is_active', header: 'is_active' },
  { id: 'actions', header: '' }
]

const { data, pending, refresh } = await useAsyncData('services-dashboard', async () => {
  return await servicesApi.list()
})

const serviceRows = computed<ServiceRow[]>(() =>
  flattenServicesPayload(data.value).map((service, index) => ({
    base_price: service.base_price ?? service.price ?? 0,
    category: service.category || 'Без категории',
    duration_minutes: Number(service.duration_minutes ?? service.duration ?? 0),
    id: String(service.id ?? `service-${index}`),
    image: String(service.image || '').trim() || null,
    is_active: Boolean(service.is_active ?? true),
    name: service.name || 'Услуга без названия'
  })).sort((left, right) => {
    const categoryComparison = left.category.localeCompare(right.category, 'ru')

    return categoryComparison !== 0
      ? categoryComparison
      : left.name.localeCompare(right.name, 'ru')
  })
)

const servicePageCount = computed(() => Math.max(1, Math.ceil(serviceRows.value.length / servicePageSize)))
const pagedServices = computed(() => {
  const start = (servicePage.value - 1) * servicePageSize
  return serviceRows.value.slice(start, start + servicePageSize)
})

watch([serviceRows, servicePage], () => {
  if (servicePage.value > servicePageCount.value) {
    servicePage.value = servicePageCount.value
  }
})

watch(serviceModalOpen, (open) => {
  if (!open) {
    resetForm()
  }
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
    useApiClient().notifyError(new Error(payload.error.issues[0]?.message || 'Некорректные данные услуги'))
    return
  }

  // Если загружен файл — отправляем multipart, иначе обычный JSON
  const body: FormData | typeof payload.data = imageFile.value
    ? (() => {
        const fd = new FormData()
        fd.append('name', payload.data.name)
        fd.append('price', String(payload.data.price ?? ''))
        fd.append('duration', String(payload.data.duration ?? ''))
        fd.append('is_active', String(payload.data.is_active ?? true))
        if (payload.data.category_name) fd.append('category_name', payload.data.category_name)
        if (payload.data.category_id) fd.append('category_id', String(payload.data.category_id))
        if (payload.data.image) fd.append('image', payload.data.image)
        fd.append('file', imageFile.value as Blob)
        return fd
      })()
    : payload.data

  if (form.id) {
    await servicesApi.update(form.id, body as any)
  }
  else {
    await servicesApi.create(body as any)
  }

  await refresh()
  serviceModalOpen.value = false
}

async function removeService(id: string) {
  await servicesApi.remove(id)
  await refresh()
}

function openPreview(src: string | null, title: string) {
  if (!src) {
    return
  }
  previewSrc.value = src
  previewTitle.value = title
  previewOpen.value = true
}

function handleImageInput(event: Event) {
  const file = (event.target as HTMLInputElement)?.files?.[0] || null
  imageFile.value = file
}

watch(imageFile, (file) => {
  if (objectUrl.value) {
    globalThis.URL?.revokeObjectURL(objectUrl.value)
    objectUrl.value = ''
  }

  if (file) {
    const created = globalThis.URL?.createObjectURL(file)
    if (created) {
      objectUrl.value = created
    }
  }
})

onBeforeUnmount(() => {
  if (objectUrl.value) {
    globalThis.URL?.revokeObjectURL(objectUrl.value)
  }
})
</script>

<template>
  <UDashboardPanel id="services">
    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4">
        <UBadge color="neutral" size="lg" variant="soft">
          {{ serviceRows.length }} услуг
        </UBadge>
        <div class="flex items-center gap-2">
          <UButton color="primary" icon="i-lucide-plus" @click="openCreateModal">
            Создать услугу
          </UButton>
          <UButton color="neutral" icon="i-lucide-refresh-cw" :loading="pending" variant="outline" @click="refresh()">
            Обновить
          </UButton>
        </div>
      </div>

      <div v-if="serviceRows.length" class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
        <div class="max-h-[80vh] overflow-auto">
          <UTable
            :columns="serviceColumns"
            :data="pagedServices"
            :loading="pending"
            sticky="header"
            :ui="{
              root: 'w-full overflow-auto',
              base: 'w-full min-w-[88rem]',
              thead: 'bg-charcoal-50/90',
              tbody: 'divide-y divide-charcoal-100',
              th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
              td: 'px-4 py-4 text-sm text-charcoal-700 align-middle'
            }"
          >
            <template #duration_minutes-cell="{ row }">
              <span class="font-medium">{{ row.original.duration_minutes }} мин</span>
            </template>

            <template #base_price-cell="{ row }">
              <span class="font-medium">{{ formatMoney(row.original.base_price) }}</span>
            </template>

            <template #image-cell="{ row }">
              <button
                v-if="row.original.image"
                class="flex items-center"
                type="button"
                @click="openPreview(row.original.image, row.original.name)"
              >
                <img
                  :alt="row.original.name"
                  :src="row.original.image"
                  class="size-12 rounded-xl border border-charcoal-200 object-cover transition hover:scale-[1.02] hover:shadow"
                >
              </button>
              <span v-else class="text-charcoal-400">Нет изображения</span>
            </template>

            <template #is_active-cell="{ row }">
              <SharedStatusBadge :label="row.original.is_active ? 'active' : 'inactive'" />
            </template>

            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-2">
                <UTooltip text="Редактировать">
                  <UButton
                    aria-label="Редактировать услугу"
                    color="neutral"
                    icon="i-lucide-pencil"
                    square
                    variant="ghost"
                    @click="startEdit(row.original)"
                  />
                </UTooltip>

                <UTooltip text="Удалить">
                  <UButton
                    aria-label="Удалить услугу"
                    color="error"
                    icon="i-lucide-trash-2"
                    square
                    variant="ghost"
                    @click="removeService(row.original.id)"
                  />
                </UTooltip>
              </div>
            </template>
          </UTable>
        </div>
        <div class="flex items-center justify-end gap-3 border-t border-charcoal-100 px-4 py-3">
          <span class="text-xs text-charcoal-500">
            Показано {{ pagedServices.length ? (servicePage - 1) * servicePageSize + 1 : 0 }}–{{ Math.min(servicePage * servicePageSize, serviceRows.length) }} из {{ serviceRows.length }}
          </span>
          <UPagination
            v-model="servicePage"
            :page-count="servicePageCount"
            :total="serviceRows.length"
            :per-page="servicePageSize"
            size="sm"
          />
        </div>
      </div>

      <SharedEmptyState
        v-else
        description="Список услуг пуст или не был получен от бэкенда."
        icon="i-lucide-badge-dollar-sign"
        title="Услуги не загружены"
      />

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

            <UFormField label="Название категории">
              <UInput v-model="form.category_name" placeholder="Стрижки, бритье, окрашивание" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Длительность">
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

            <div v-if="form.image || imageFile" class="rounded-xl border border-charcoal-200 bg-white/70 p-3">
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
