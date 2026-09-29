<script setup lang="ts">
import type { MarketplaceBanner } from '~/composables/useMarketplaceBannersApi'

definePageMeta({})

const api = useMarketplaceBannersApi()
const apiClient = useApiClient()
const sessionStore = useSessionStore()

const banners = ref<MarketplaceBanner[]>([])
const pending = ref(true)
const saving = ref(false)
const selectedId = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  title_ru: '',
  title_uz: '',
  title_en: '',
  description_ru: '',
  description_uz: '',
  description_en: '',
  sort_order: 0,
  is_active: true,
  file: null as File | null
})

const selected = computed(() => banners.value.find(item => String(item.id) === selectedId.value) || null)

function localized(item: MarketplaceBanner, key: 'title' | 'description', locale: string) {
  return item.locales?.[key]?.[locale] || ''
}

function resetForm() {
  selectedId.value = null
  form.title_ru = ''
  form.title_uz = ''
  form.title_en = ''
  form.description_ru = ''
  form.description_uz = ''
  form.description_en = ''
  form.sort_order = banners.value.length
  form.is_active = true
  form.file = null
  if (fileInput.value) fileInput.value.value = ''
}

function edit(item: MarketplaceBanner) {
  selectedId.value = String(item.id)
  form.title_ru = localized(item, 'title', 'ru')
  form.title_uz = localized(item, 'title', 'uz')
  form.title_en = localized(item, 'title', 'en')
  form.description_ru = localized(item, 'description', 'ru')
  form.description_uz = localized(item, 'description', 'uz')
  form.description_en = localized(item, 'description', 'en')
  form.sort_order = Number(item.sort_order || 0)
  form.is_active = item.is_active !== false
  form.file = null
  if (fileInput.value) fileInput.value.value = ''
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  form.file = input.files?.[0] || null
}

function makeBody() {
  const body = new FormData()
  body.append('title_ru', form.title_ru.trim())
  body.append('title_uz', form.title_uz.trim())
  body.append('title_en', form.title_en.trim())
  body.append('description_ru', form.description_ru.trim())
  body.append('description_uz', form.description_uz.trim())
  body.append('description_en', form.description_en.trim())
  body.append('sort_order', String(form.sort_order))
  body.append('is_active', String(form.is_active))
  if (form.file) body.append('file', form.file)
  return body
}

async function load() {
  pending.value = true
  try {
    const response = await api.list()
    banners.value = [...(response.data || [])].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
  }
  catch (error: any) {
    if ([401, 403].includes(error?.statusCode || error?.status)) {
      await sessionStore.logout()
      await navigateTo('/login')
    }
  }
  finally {
    pending.value = false
  }
}

async function save() {
  if (!form.title_ru && !form.title_uz && !form.title_en) {
    apiClient.notifyError(new Error('Укажите заголовок хотя бы на одном языке'))
    return
  }
  if (!form.description_ru && !form.description_uz && !form.description_en) {
    apiClient.notifyError(new Error('Укажите описание хотя бы на одном языке'))
    return
  }
  if (!selectedId.value && !form.file) {
    apiClient.notifyError(new Error('Выберите изображение баннера'))
    return
  }

  saving.value = true
  try {
    if (selectedId.value) await api.update(selectedId.value, makeBody())
    else await api.create(makeBody())
    apiClient.notifySuccess(selectedId.value ? 'Баннер обновлён' : 'Баннер создан')
    await load()
    resetForm()
  }
  finally {
    saving.value = false
  }
}

async function remove(item: MarketplaceBanner) {
  if (!window.confirm('Скрыть этот баннер?')) return
  await api.remove(String(item.id))
  await load()
  if (selectedId.value === String(item.id)) resetForm()
}

await load()
</script>

<template>
  <UDashboardPanel id="settings-banners">
    <template #header>
      <UDashboardNavbar title="Баннеры приложения" :ui="{ right: 'gap-3' }">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="pending" @click="load">
            Обновить
          </UButton>
          <UButton v-if="selectedId" color="neutral" variant="ghost" @click="resetForm">
            Новый баннер
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <template #header>
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">Контент приложения</p>
              <p class="mt-1 text-sm text-charcoal-600">Статичные баннеры. Порядок задаётся числом.</p>
            </div>
          </template>

          <div v-if="pending" class="flex justify-center py-12"><ULoader size="lg" /></div>
          <div v-else-if="!banners.length" class="rounded-2xl border border-dashed border-charcoal-300 p-10 text-center text-sm text-charcoal-600">
            Баннеров пока нет. Создайте первый справа.
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in banners"
              :key="item.id"
              class="flex items-center gap-4 rounded-2xl border p-3"
              :class="selectedId === String(item.id) ? 'border-[#C4A26F] bg-[#C4A26F]/10' : 'border-charcoal-200 bg-white'"
            >
              <img v-if="item.media?.url" :src="item.media.url" class="h-20 w-32 rounded-xl object-cover" alt="">
              <div v-else class="h-20 w-32 rounded-xl bg-charcoal-100" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-charcoal-900">{{ localized(item, 'title', 'ru') || localized(item, 'title', 'en') || 'Без заголовка' }}</p>
                <p class="mt-1 truncate text-sm text-charcoal-600">{{ localized(item, 'description', 'ru') || 'Без описания' }}</p>
                <UBadge class="mt-2" :color="item.is_active === false ? 'neutral' : 'success'" variant="subtle">
                  {{ item.is_active === false ? 'Скрыт' : 'Активен' }} · #{{ item.sort_order || 0 }}
                </UBadge>
              </div>
              <div class="flex shrink-0 gap-2">
                <UButton size="sm" color="neutral" variant="outline" @click="edit(item)">Изменить</UButton>
                <UButton size="sm" color="error" variant="ghost" @click="remove(item)">Скрыть</UButton>
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <template #header>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">{{ selected ? 'Редактирование' : 'Новый баннер' }}</p>
          </template>
          <div class="space-y-4">
            <UFormField label="Изображение (до 5 МБ)">
              <input ref="fileInput" type="file" accept="image/*" class="block w-full text-sm" @change="onFileChange">
            </UFormField>
            <div class="grid gap-3 sm:grid-cols-3">
              <UFormField label="Заголовок RU"><UInput v-model="form.title_ru" /></UFormField>
              <UFormField label="Заголовок UZ"><UInput v-model="form.title_uz" /></UFormField>
              <UFormField label="Заголовок EN"><UInput v-model="form.title_en" /></UFormField>
            </div>
            <div class="grid gap-3 sm:grid-cols-3">
              <UFormField label="Описание RU"><UTextarea v-model="form.description_ru" :rows="3" /></UFormField>
              <UFormField label="Описание UZ"><UTextarea v-model="form.description_uz" :rows="3" /></UFormField>
              <UFormField label="Описание EN"><UTextarea v-model="form.description_en" :rows="3" /></UFormField>
            </div>
            <div class="flex items-end gap-4">
              <UFormField label="Порядок"><UInput v-model.number="form.sort_order" type="number" min="0" /></UFormField>
              <USwitch v-model="form.is_active" label="Активен" />
            </div>
            <UButton block color="primary" :loading="saving" @click="save">
              {{ selected ? 'Сохранить изменения' : 'Создать баннер' }}
            </UButton>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
