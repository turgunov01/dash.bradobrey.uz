<script setup lang="ts">
import Draggable from 'vuedraggable'

import type { KioskAdsSettings } from '~/composables/useKioskAdsSettingsApi'
import { parseYouTubeLink } from '~/utils/youtube'

definePageMeta({})

type UrlRow = {
  id: string
  url: string
}

type UrlListValidation = {
  errorsById: Record<string, string>
  listError: string
  normalizedUrls: string[] | null
  previewById: Record<string, { canonicalUrl: string, videoId: string }>
}

const apiClient = useApiClient()
const adsApi = useKioskAdsSettingsApi()
const sessionStore = useSessionStore()

const submitting = ref(false)

const regularRows = ref<UrlRow[]>([])
const kidsRows = ref<UrlRow[]>([])

const snapshot = ref<Pick<KioskAdsSettings, 'regular_urls' | 'kids_urls' | 'updated_at'> | null>(null)

function isAuthError(err: any) {
  const status = err?.statusCode || err?.response?.status || err?.status
  return status === 401 || status === 403
}

async function handleAuthError(err: any) {
  if (!isAuthError(err)) return

  try {
    await sessionStore.logout()
  }
  finally {
    await navigateTo('/login')
  }
}

function makeStableRows(prefix: string, urls: string[]) {
  return urls.map((url, index) => ({
    id: `${prefix}-${index}`,
    url
  }))
}

function normalizeUrls(urls: unknown) {
  if (!Array.isArray(urls)) return [] as string[]

  return urls
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .map((value) => parseYouTubeLink(value)?.canonicalUrl || value)
}

function applySettings(settings: KioskAdsSettings | null | undefined) {
  if (!settings) return

  const regular = normalizeUrls(settings.regular_urls)
  const kids = normalizeUrls(settings.kids_urls)

  snapshot.value = {
    kids_urls: kids,
    regular_urls: regular,
    updated_at: String(settings.updated_at || '')
  }

  regularRows.value = makeStableRows('regular', regular)
  kidsRows.value = makeStableRows('kids', kids)
}

function formatUpdatedAt(value: string | null | undefined) {
  const raw = String(value || '').trim()
  if (!raw) return '—'

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const updatedAtLabel = computed(() => formatUpdatedAt(snapshot.value?.updated_at))

function validateList(rows: UrlRow[]): UrlListValidation {
  const errorsById: Record<string, string> = {}
  const previewById: Record<string, { canonicalUrl: string, videoId: string }> = {}

  if (rows.length > 50) {
    return {
      errorsById,
      listError: 'Максимум 50 ссылок',
      normalizedUrls: null,
      previewById
    }
  }

  const normalized: string[] = []

  for (const row of rows) {
    const raw = String(row.url || '').trim()

    if (!raw) {
      errorsById[row.id] = 'Пустая строка запрещена'
      continue
    }

    const parsed = parseYouTubeLink(raw)

    if (!parsed) {
      errorsById[row.id] = 'Невалидная YouTube-ссылка'
      continue
    }

    previewById[row.id] = parsed
    normalized.push(parsed.canonicalUrl)
  }

  const hasErrors = Object.keys(errorsById).length > 0

  return {
    errorsById,
    listError: '',
    normalizedUrls: hasErrors ? null : normalized,
    previewById
  }
}

const regularValidation = computed(() => validateList(regularRows.value))
const kidsValidation = computed(() => validateList(kidsRows.value))

const hasChanges = computed(() => {
  const base = snapshot.value
  if (!base) return false

  const currentRegular = regularRows.value.map(row => String(row.url || '').trim())
  const currentKids = kidsRows.value.map(row => String(row.url || '').trim())

  return JSON.stringify(currentRegular) !== JSON.stringify(base.regular_urls)
    || JSON.stringify(currentKids) !== JSON.stringify(base.kids_urls)
})

const canSave = computed(() => {
  return Boolean(regularValidation.value.normalizedUrls)
    && Boolean(kidsValidation.value.normalizedUrls)
    && hasChanges.value
    && !submitting.value
})

function addRow(target: 'regular' | 'kids') {
  const list = target === 'regular' ? regularRows : kidsRows
  const title = target === 'regular' ? 'Обычная реклама' : 'Детская реклама'

  if (list.value.length >= 50) {
    apiClient.notifyError(new Error(`В разделе «${title}» максимум 50 ссылок`))
    return
  }

  list.value.push({
    id: `${target}-new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    url: ''
  })
}

function removeRow(target: 'regular' | 'kids', id: string) {
  const list = target === 'regular' ? regularRows : kidsRows
  list.value = list.value.filter(row => row.id !== id)
}

function clearList(target: 'regular' | 'kids') {
  const list = target === 'regular' ? regularRows : kidsRows
  list.value = []
}

function moveRow(target: 'regular' | 'kids', index: number, direction: -1 | 1) {
  const list = target === 'regular' ? regularRows : kidsRows
  const nextIndex = index + direction

  if (nextIndex < 0 || nextIndex >= list.value.length) {
    return
  }

  const copy = [...list.value]
  const [item] = copy.splice(index, 1)
  if (!item) return
  copy.splice(nextIndex, 0, item)
  list.value = copy
}

const { data, pending, refresh, error } = await useAsyncData('settings-kiosk-ads', async () => {
  return await adsApi.getSettings()
}, { server: false })

watch(
  () => data.value?.settings,
  (settings) => applySettings(settings),
  { immediate: true }
)

watch(error, (err) => {
  if (err) {
    handleAuthError(err)
  }
})

async function submit() {
  const regularUrls = regularValidation.value.normalizedUrls
  const kidsUrls = kidsValidation.value.normalizedUrls

  if (!regularUrls || !kidsUrls) {
    const listError = regularValidation.value.listError || kidsValidation.value.listError
    apiClient.notifyError(new Error(listError || 'Проверьте ссылки в списках'))
    return
  }

  submitting.value = true

  try {
    const response = await adsApi.updateSettings({
      kids_urls: kidsUrls,
      regular_urls: regularUrls
    })

    applySettings(response?.settings)
    apiClient.notifySuccess('Сохранено')
    await refresh()
  }
  catch (err: any) {
    await handleAuthError(err)
    return
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="settings-kiosk-ads">
    <template #header>
      <UDashboardNavbar title="Реклама киоска (YouTube)" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="primary"
            icon="i-lucide-save"
            :disabled="!canSave"
            :loading="submitting"
            @click="submit"
          >
            Сохранить
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="pending"
            @click="refresh()"
          >
            Обновить
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="text-xs text-charcoal-600">
          Последнее обновление: {{ updatedAtLabel }}
        </div>

        <div v-if="pending" class="flex justify-center py-10">
          <ULoader size="lg" />
        </div>

        <div v-else class="grid gap-6 xl:grid-cols-2">
          <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
            <template #header>
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Обычная реклама
                  </p>
                  <p class="text-sm text-charcoal-600">
                    Принимаем ссылки на YouTube (youtube.com / youtu.be). Лучше использовать https.
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <UButton size="sm" icon="i-lucide-plus" @click="addRow('regular')">
                    Добавить
                  </UButton>
                  <UButton
                    size="sm"
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-trash-2"
                    :disabled="!regularRows.length"
                    @click="clearList('regular')"
                  >
                    Очистить
                  </UButton>
                </div>
              </div>
            </template>

            <UAlert
              v-if="regularValidation.listError"
              color="error"
              icon="i-lucide-alert-triangle"
              :title="regularValidation.listError"
              class="mb-4"
            />

            <Draggable
              v-model="regularRows"
              item-key="id"
              handle=".drag-handle"
              class="space-y-2"
              ghost-class="opacity-60"
            >
              <template #item="{ element, index }">
                <div class="rounded-xl border border-charcoal-200 bg-white/90 p-3">
                  <div class="flex items-start gap-2">
                    <UButton icon="i-lucide-grip-vertical" variant="ghost" size="xs" class="drag-handle cursor-grab" />

                    <div class="min-w-0 flex-1">
                      <UFormField
                        :label="`#${index + 1}`"
                        :error="regularValidation.errorsById[element.id] || ''"
                      >
                        <UInput v-model="element.url" placeholder="https://youtu.be/VIDEO_ID" />
                      </UFormField>

                      <div class="mt-2 flex flex-wrap items-center gap-2">
                        <UButton
                          v-if="regularValidation.previewById[element.id]"
                          size="xs"
                          color="neutral"
                          variant="ghost"
                          icon="i-lucide-external-link"
                          :to="regularValidation.previewById[element.id]?.canonicalUrl"
                          target="_blank"
                        >
                          Открыть
                        </UButton>

                        <UButton
                          size="xs"
                          color="neutral"
                          variant="ghost"
                          icon="i-lucide-arrow-up"
                          :disabled="index === 0"
                          @click="moveRow('regular', index, -1)"
                        />
                        <UButton
                          size="xs"
                          color="neutral"
                          variant="ghost"
                          icon="i-lucide-arrow-down"
                          :disabled="index === regularRows.length - 1"
                          @click="moveRow('regular', index, 1)"
                        />

                        <UButton
                          size="xs"
                          color="error"
                          variant="ghost"
                          icon="i-lucide-trash-2"
                          @click="removeRow('regular', element.id)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Draggable>

            <div v-if="!regularRows.length" class="py-6 text-sm text-charcoal-600">
              Добавьте ссылки на ролики для обычной рекламы.
            </div>
          </UCard>

          <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
            <template #header>
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                    Детская реклама
                  </p>
                  <p class="text-sm text-charcoal-600">
                    Принимаем ссылки на YouTube (youtube.com / youtu.be). Лучше использовать https.
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <UButton size="sm" icon="i-lucide-plus" @click="addRow('kids')">
                    Добавить
                  </UButton>
                  <UButton
                    size="sm"
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-trash-2"
                    :disabled="!kidsRows.length"
                    @click="clearList('kids')"
                  >
                    Очистить
                  </UButton>
                </div>
              </div>
            </template>

            <UAlert
              v-if="kidsValidation.listError"
              color="error"
              icon="i-lucide-alert-triangle"
              :title="kidsValidation.listError"
              class="mb-4"
            />

            <Draggable
              v-model="kidsRows"
              item-key="id"
              handle=".drag-handle"
              class="space-y-2"
              ghost-class="opacity-60"
            >
              <template #item="{ element, index }">
                <div class="rounded-xl border border-charcoal-200 bg-white/90 p-3">
                  <div class="flex items-start gap-2">
                    <UButton icon="i-lucide-grip-vertical" variant="ghost" size="xs" class="drag-handle cursor-grab" />

                    <div class="min-w-0 flex-1">
                      <UFormField
                        :label="`#${index + 1}`"
                        :error="kidsValidation.errorsById[element.id] || ''"
                      >
                        <UInput v-model="element.url" placeholder="https://youtu.be/VIDEO_ID" />
                      </UFormField>

                      <div class="mt-2 flex flex-wrap items-center gap-2">
                        <UButton
                          v-if="kidsValidation.previewById[element.id]"
                          size="xs"
                          color="neutral"
                          variant="ghost"
                          icon="i-lucide-external-link"
                          :to="kidsValidation.previewById[element.id]?.canonicalUrl"
                          target="_blank"
                        >
                          Открыть
                        </UButton>

                        <UButton
                          size="xs"
                          color="neutral"
                          variant="ghost"
                          icon="i-lucide-arrow-up"
                          :disabled="index === 0"
                          @click="moveRow('kids', index, -1)"
                        />
                        <UButton
                          size="xs"
                          color="neutral"
                          variant="ghost"
                          icon="i-lucide-arrow-down"
                          :disabled="index === kidsRows.length - 1"
                          @click="moveRow('kids', index, 1)"
                        />

                        <UButton
                          size="xs"
                          color="error"
                          variant="ghost"
                          icon="i-lucide-trash-2"
                          @click="removeRow('kids', element.id)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Draggable>

            <div v-if="!kidsRows.length" class="py-6 text-sm text-charcoal-600">
              Добавьте ссылки на ролики для детской рекламы.
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
