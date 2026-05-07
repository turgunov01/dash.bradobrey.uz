<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

type ActiveFilter = 'all' | 'active'

const marketplaceApi = useMarketplaceApi()

const bannerModalOpen = ref(false)
const activeFilter = ref<ActiveFilter>('all')
const searchQuery = ref('')

const filterItems = [
  { label: 'Все', value: 'all' as const },
  { label: 'Активные', value: 'active' as const }
]

function extractBannerItems(response: unknown): any[] {
  if (Array.isArray(response)) {
    return response
  }

  if (!response || typeof response !== 'object') {
    return []
  }

  const payload = response as any

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.entry)) {
    return payload.entry
  }

  if (payload.payload && typeof payload.payload === 'object') {
    const inner = payload.payload

    if (Array.isArray(inner.data)) {
      return inner.data
    }

    if (Array.isArray(inner.items)) {
      return inner.items
    }
  }

  return []
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function getLocaleValue(item: any, key: 'title' | 'description', locale: 'uz' | 'ru' | 'en') {
  const direct = normalizeText(item?.[`${key}_${locale}`])
  if (direct) return direct

  const locales = item?.locales || {}
  const block = locales?.[key] || {}
  const nested = normalizeText(block?.[locale])
  if (nested) return nested

  return ''
}

function getBannerTitle(item: any) {
  return (
    getLocaleValue(item, 'title', 'ru')
    || getLocaleValue(item, 'title', 'uz')
    || getLocaleValue(item, 'title', 'en')
    || normalizeText(item?.title)
    || 'Баннер без названия'
  )
}

const columns: TableColumn<any>[] = [
  { id: 'titles', header: 'Заголовки (uz/ru/en)' },
  { id: 'descriptions', header: 'Описание (uz/ru/en)' },
  { accessorKey: 'sort_order', header: 'sort_order' },
  { accessorKey: 'is_active', header: 'is_active' },
  { id: 'media', header: 'Медиа' },
  { id: 'actions', header: 'Действия' }
]

const selectedFile = ref<File | null>(null)
const imagePreviewSrc = ref<string | null>(null)

const form = reactive({
  description_en: '',
  description_ru: '',
  description_uz: '',
  id: '',
  is_active: true,
  sort_order: 0,
  title_en: '',
  title_ru: '',
  title_uz: ''
})

function resetForm() {
  form.description_en = ''
  form.description_ru = ''
  form.description_uz = ''
  form.id = ''
  form.is_active = true
  form.sort_order = 0
  form.title_en = ''
  form.title_ru = ''
  form.title_uz = ''
  selectedFile.value = null
}

watch(bannerModalOpen, (open) => {
  if (!open) {
    resetForm()
  }
})

const { data, pending, refresh } = await useAsyncData('admin-marketplace-banners', async () => {
  const banners = await marketplaceApi.banners.list()
  return extractBannerItems(banners)
}, {
  server: false
})

const rows = computed(() => {
  const raw = Array.isArray(data.value) ? data.value : []

  return raw.map((item, index) => ({
    id: String(item?.id ?? item?._id ?? `banner-${index}`),
    is_active: Boolean(item?.is_active ?? true),
    sort_order: Number(item?.sort_order ?? 0),
    media_url: normalizeText(item?.media?.url) || normalizeText(item?.media_url) || '',
    title_uz: getLocaleValue(item, 'title', 'uz'),
    title_ru: getLocaleValue(item, 'title', 'ru'),
    title_en: getLocaleValue(item, 'title', 'en'),
    description_uz: getLocaleValue(item, 'description', 'uz'),
    description_ru: getLocaleValue(item, 'description', 'ru'),
    description_en: getLocaleValue(item, 'description', 'en'),
    raw: item
  }))
})

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  let list = rows.value

  if (activeFilter.value === 'active') {
    list = list.filter(row => row.is_active)
  }

  if (!query) {
    return list
  }

  return list.filter((row) => {
    const haystack = [
      row.title_uz,
      row.title_ru,
      row.title_en
    ].join(' ').toLowerCase()

    return haystack.includes(query)
  })
})

const modalTitle = computed(() => (form.id ? 'Редактировать баннер' : 'Создать баннер'))
const modalDescription = computed(() =>
  form.id
    ? 'Обновите данные выбранного баннера.'
    : 'Заполните форму, чтобы добавить новый баннер в маркетплейс.'
)

function openCreateModal() {
  resetForm()
  bannerModalOpen.value = true
}

function editBanner(row: any) {
  const item = row?.raw ?? row

  resetForm()

  form.description_en = getLocaleValue(item, 'description', 'en')
  form.description_ru = getLocaleValue(item, 'description', 'ru')
  form.description_uz = getLocaleValue(item, 'description', 'uz')
  form.id = normalizeText(item?.id ?? item?._id)
  form.is_active = Boolean(item?.is_active ?? true)
  form.sort_order = Number(item?.sort_order ?? 0)
  form.title_en = getLocaleValue(item, 'title', 'en')
  form.title_ru = getLocaleValue(item, 'title', 'ru')
  form.title_uz = getLocaleValue(item, 'title', 'uz')

  bannerModalOpen.value = true
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] || null
}

async function submitBanner() {
  const formData = new FormData()

  // Keep payload compatible with existing backend fields.
  const fallbackTitle = form.title_ru || form.title_uz || form.title_en
  const fallbackDescription = form.description_ru || form.description_uz || form.description_en
  const locale = (form.title_uz || form.description_uz)
    ? 'uz'
    : (form.title_ru || form.description_ru)
        ? 'ru'
        : 'en'

  formData.append('title', fallbackTitle)
  formData.append('title_uz', form.title_uz)
  formData.append('title_ru', form.title_ru)
  formData.append('title_en', form.title_en)
  formData.append('description', fallbackDescription)
  formData.append('description_uz', form.description_uz)
  formData.append('description_ru', form.description_ru)
  formData.append('description_en', form.description_en)
  formData.append('locale', locale)
  formData.append('is_active', String(form.is_active))
  formData.append('sort_order', String(form.sort_order ?? 0))

  if (selectedFile.value) {
    formData.append('file', selectedFile.value)
  }

  if (form.id) {
    await marketplaceApi.banners.update(form.id, formData)
  }
  else {
    await marketplaceApi.banners.create(formData)
  }

  resetForm()
  await refresh()
  bannerModalOpen.value = false
}

async function toggleBanner(row: any) {
  const item = row?.raw ?? row
  const id = normalizeText(item?.id ?? item?._id)

  if (!id) return

  await marketplaceApi.banners.toggleActive(id, !Boolean(item?.is_active ?? true))
  await refresh()
}

function openImagePreview(url?: string | null) {
  imagePreviewSrc.value = url || null
}

const imageModalOpen = computed({
  get: () => Boolean(imagePreviewSrc.value),
  set: (value: boolean) => {
    if (!value) {
      imagePreviewSrc.value = null
    }
  }
})
</script>

<template>
  <div class="grid gap-6">
    <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
      <template #header>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
              Список баннеров
            </p>
            <h3 class="barbershop-heading text-2xl text-charcoal-950">
              Баннеры
            </h3>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Поиск по name"
              class="w-full sm:w-64"
            />

            <USelectMenu
              v-model="activeFilter"
              :items="filterItems"
              value-key="value"
              class="w-full sm:w-44"
            />

            <UButton color="primary" icon="i-lucide-plus" @click="openCreateModal">
              Создать баннер
            </UButton>
          </div>
        </div>
      </template>

      <div v-if="filteredRows.length" class="overflow-hidden rounded-[1.25rem] border border-charcoal-200 bg-white/90">
        <div class="max-h-[78vh] overflow-auto">
          <UTable
            :columns="columns"
            :data="filteredRows"
            :loading="pending"
            sticky="header"
            :ui="{
              root: 'w-full overflow-auto',
              base: 'w-full min-w-[86rem]',
              thead: 'bg-charcoal-50/90',
              tbody: 'divide-y divide-charcoal-100',
              th: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal-500',
              td: 'px-4 py-4 text-sm text-charcoal-700 align-top'
            }"
          >
            <template #titles-cell="{ row }">
              <div class="space-y-1">
                <p class="font-semibold text-charcoal-950">
                  {{ row.original.title_uz || '—' }}
                </p>
                <p class="text-xs text-charcoal-500">
                  uz
                </p>
                <p class="font-semibold text-charcoal-950">
                  {{ row.original.title_ru || '—' }}
                </p>
                <p class="text-xs text-charcoal-500">
                  ru
                </p>
                <p class="font-semibold text-charcoal-950">
                  {{ row.original.title_en || '—' }}
                </p>
                <p class="text-xs text-charcoal-500">
                  en
                </p>
              </div>
            </template>

            <template #descriptions-cell="{ row }">
              <div class="space-y-1">
                <p class="line-clamp-3 text-sm text-charcoal-700">
                  {{ row.original.description_uz || '—' }}
                </p>
                <p class="text-xs text-charcoal-500">
                  uz
                </p>
                <p class="line-clamp-3 text-sm text-charcoal-700">
                  {{ row.original.description_ru || '—' }}
                </p>
                <p class="text-xs text-charcoal-500">
                  ru
                </p>
                <p class="line-clamp-3 text-sm text-charcoal-700">
                  {{ row.original.description_en || '—' }}
                </p>
                <p class="text-xs text-charcoal-500">
                  en
                </p>
              </div>
            </template>

            <template #sort_order-cell="{ row }">
              <span class="font-mono text-sm text-charcoal-900">{{ row.original.sort_order ?? 0 }}</span>
            </template>

            <template #is_active-cell="{ row }">
              <SharedStatusBadge :label="row.original.is_active ? 'active' : 'inactive'" />
            </template>

            <template #media-cell="{ row }">
              <div class="flex items-center gap-3">
                <button
                  v-if="row.original.media_url"
                  type="button"
                  class="rounded-lg border border-charcoal-200 transition hover:border-brass-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-300"
                  @click="openImagePreview(row.original.media_url)"
                >
                  <img
                    :src="row.original.media_url"
                    :alt="getBannerTitle(row.original.raw)"
                    class="h-12 w-16 rounded-lg object-cover"
                  >
                </button>
                <span v-else class="text-xs text-charcoal-500">—</span>
              </div>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex flex-wrap gap-2">
                <UButton color="neutral" size="xs" variant="outline" @click="editBanner(row.original)">
                  Редактировать
                </UButton>
                <UButton color="neutral" size="xs" variant="outline" @click="toggleBanner(row.original)">
                  {{ row.original.is_active ? 'Скрыть' : 'Показать' }}
                </UButton>
              </div>
            </template>
          </UTable>
        </div>
      </div>

      <SharedEmptyState
        v-else
        description="Эндпоинт /api/marketplace/banners не вернул ни одного баннера."
        icon="i-lucide-image-up"
        title="Баннеров нет"
      />
    </UCard>

    <UModal
      v-model:open="imageModalOpen"
      class="sm:max-w-3xl"
      title="Просмотр баннера"
    >
      <template #body>
        <div class="flex justify-center">
          <img
            v-if="imagePreviewSrc"
            :src="imagePreviewSrc"
            alt="banner preview"
            class="max-h-[70vh] max-w-full rounded-2xl border border-charcoal-200 object-contain shadow-lg"
          >
          <p v-else class="text-sm text-charcoal-500">
            Изображение недоступно
          </p>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="bannerModalOpen"
      class="sm:max-w-xl"
      :description="modalDescription"
      :title="modalTitle"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-3">
            <UFormField label="Заголовок (UZ)">
              <UInput v-model="form.title_uz" />
            </UFormField>
            <UFormField label="Заголовок (RU)">
              <UInput v-model="form.title_ru" />
            </UFormField>
            <UFormField label="Заголовок (EN)">
              <UInput v-model="form.title_en" />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <UFormField label="Описание (UZ)">
              <UTextarea v-model="form.description_uz" :rows="3" />
            </UFormField>
            <UFormField label="Описание (RU)">
              <UTextarea v-model="form.description_ru" :rows="3" />
            </UFormField>
            <UFormField label="Описание (EN)">
              <UTextarea v-model="form.description_en" :rows="3" />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <UFormField label="sort_order">
              <UInput v-model="form.sort_order" type="number" />
            </UFormField>

            <div class="flex items-center pt-6">
              <UCheckbox v-model="form.is_active" label="Активен" />
            </div>
          </div>

          <UFormField label="Файл (file)">
            <UInput type="file" @change="onFileChange" />
          </UFormField>
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
          <UButton color="primary" icon="i-lucide-save" @click="submitBanner">
            {{ form.id ? 'Обновить' : 'Создать' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
