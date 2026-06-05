<script setup lang="ts">
definePageMeta({
})

const route = useRoute()
const apiClient = useApiClient()
const uiStore = useUiStore()
const branchStore = useBranchStore()

await branchStore.ensureLoaded()

const presets = computed(() => [
  { body: '', label: 'Проверка API', method: 'GET', path: '/api/health', value: 'health' },
  { body: '', label: 'Конфиг киоска', method: 'GET', path: '/api/kiosk/config', value: 'kiosk-config' },
  { body: '', label: 'Профиль барбера', method: 'GET', path: '/api/barbers/me', value: 'barber-me' },
  { body: '', label: 'Услуги', method: 'GET', path: '/api/services', value: 'services' },
  { body: '', label: 'Статистика', method: 'GET', path: '/api/statistics', value: 'statistics' },
  { body: '{"code":"TEST"}', label: 'Проверка промокода', method: 'POST', path: '/api/promo-code/validate', value: 'promo-validate' },
  { body: '{"code":"CERT-001"}', label: 'Проверка сертификата', method: 'GET', path: '/api/kiosk/certificate/CERT-001', value: 'certificate' }
])

const selectedPreset = ref(String(route.query.preset || presets.value[0]?.value || 'health'))
const form = reactive({
  body: '',
  method: 'GET' as 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
  path: '/api/health'
})
const result = ref<unknown>(null)

watch(
  selectedPreset,
  (presetValue) => {
    const preset = presets.value.find(item => item.value === presetValue)

    if (!preset) {
      return
    }

    form.body = preset.body
    form.method = preset.method as typeof form.method
    form.path = preset.path
  },
  { immediate: true }
)

async function executeRequest() {
  let body: Record<string, unknown> | undefined

  if (form.body.trim()) {
    try {
      body = JSON.parse(form.body)
    }
    catch {
      apiClient.notifyError(new Error('Тело запроса должно быть валидным JSON'))
      return
    }
  }

  const response = await apiClient.rawRequest(form.path, {
    body,
    method: form.method
  })

  result.value = {
    headers: Object.fromEntries(response.headers.entries()),
    payload: response.data,
    status: response.status
  }
}
</script>

<template>
  <UDashboardPanel id="api-debug">
    <template #header>
      <UDashboardNavbar title="Отладка API" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton color="neutral" icon="i-lucide-trash-2" variant="outline" @click="uiStore.clearDebug()">
            Очистить лог
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div class="space-y-6">
          <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
            <template #header>
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                  Запуск запросов
                </p>
                <h2 class="barbershop-heading text-3xl text-charcoal-950">
                  Проверка Nuxt BFF
                </h2>
              </div>
            </template>

            <div class="space-y-4">
              <UFormField label="Пресет">
                <USelectMenu v-model="selectedPreset" :items="presets" value-key="value" />
              </UFormField>
              <div class="grid gap-4 sm:grid-cols-[0.3fr_0.7fr]">
                <UFormField label="Метод">
                  <USelectMenu
                    v-model="form.method"
                    :items="[
                      { label: 'GET', value: 'GET' },
                      { label: 'POST', value: 'POST' },
                      { label: 'PATCH', value: 'PATCH' },
                      { label: 'PUT', value: 'PUT' },
                      { label: 'DELETE', value: 'DELETE' }
                    ]"
                    value-key="value"
                  />
                </UFormField>
                <UFormField label="Путь">
                  <UInput v-model="form.path" />
                </UFormField>
              </div>
              <UFormField label="Тело JSON">
                <UTextarea v-model="form.body" :rows="8" />
              </UFormField>
              <UButton color="primary" icon="i-lucide-play" @click="executeRequest">
                Выполнить запрос
              </UButton>
            </div>
          </UCard>

          <SharedJsonBlock v-if="result" label="Последний ответ" :value="result" />
        </div>

        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <template #header>
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                Последние клиентские запросы
              </p>
              <h2 class="barbershop-heading text-3xl text-charcoal-950">
                Поток отладки
              </h2>
            </div>
          </template>

          <div v-if="uiStore.apiDebugEntries.length" class="space-y-3">
            <div
              v-for="entry in uiStore.apiDebugEntries"
              :key="`${entry.at}-${entry.url}`"
              class="rounded-[1.25rem] border border-charcoal-200 bg-white/80 p-4"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="font-medium text-charcoal-950">{{ entry.method }} {{ entry.url }}</p>
                  <p class="text-xs uppercase tracking-[0.18em] text-charcoal-500">{{ entry.at }}</p>
                </div>
                <SharedStatusBadge :label="entry.status" />
              </div>
              <pre class="mt-4 overflow-auto text-xs leading-6 text-charcoal-700">{{ JSON.stringify(entry.response || entry.error, null, 2) }}</pre>
            </div>
          </div>
          <SharedEmptyState
            v-else
            description="Здесь будут отображаться последние клиентские запросы панели после использования интерфейса или запуска запроса с этой страницы."
            icon="i-lucide-terminal"
            title="Записей отладки пока нет"
          />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
