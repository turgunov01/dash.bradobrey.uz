<script setup lang="ts">
import type { CashbackSettings } from '~/composables/useCashbackSettingsApi'

const apiClient = useApiClient()
const settingsApi = useCashbackSettingsApi()
const sessionStore = useSessionStore()
const submitting = ref(false)

type CashbackForm = Omit<CashbackSettings, 'promotion_start_date' | 'promotion_end_date'> & {
  promotion_start_date: string
  promotion_end_date: string
}

const form = reactive<CashbackForm>({
  default_percent: 1,
  promotion_percent: null,
  promotion_start_date: '',
  promotion_end_date: '',
  timezone: 'Asia/Tashkent'
})
const snapshot = ref<CashbackSettings | null>(null)

function normalize(value: Partial<CashbackSettings> & { promotion_start_date?: string | null, promotion_end_date?: string | null }): CashbackSettings {
  return {
    default_percent: Number(value.default_percent ?? 1),
    promotion_percent: value.promotion_percent === null || value.promotion_percent === undefined ? null : Number(value.promotion_percent),
    promotion_start_date: value.promotion_start_date || null,
    promotion_end_date: value.promotion_end_date || null,
    timezone: String(value.timezone || 'Asia/Tashkent')
  }
}

function apply(value: CashbackSettings) {
  const next = normalize(value)
  Object.assign(form, {
    ...next,
    promotion_start_date: next.promotion_start_date || '',
    promotion_end_date: next.promotion_end_date || ''
  })
  snapshot.value = { ...next }
}

const { data, pending, error, refresh } = await useAsyncData('settings-cashback', () => settingsApi.getSettings(), { server: false })
watch(() => data.value, value => { if (value) apply(value) }, { immediate: true })

const validation = computed(() => {
  const errors: Record<string, string> = {}
  if (!Number.isFinite(Number(form.default_percent)) || Number(form.default_percent) < 0 || Number(form.default_percent) > 100) {
    errors.default_percent = 'Введите значение от 0 до 100'
  }
  if (form.promotion_percent !== null && (!Number.isFinite(Number(form.promotion_percent)) || Number(form.promotion_percent) < 0 || Number(form.promotion_percent) > 100)) {
    errors.promotion_percent = 'Введите значение от 0 до 100'
  }
  if ((form.promotion_start_date && !form.promotion_end_date) || (!form.promotion_start_date && form.promotion_end_date)) {
    errors.promotion_dates = 'Укажите обе даты акции'
  }
  if (form.promotion_start_date && form.promotion_end_date && form.promotion_start_date > form.promotion_end_date) {
    errors.promotion_dates = 'Дата окончания не может быть раньше даты начала'
  }
  return errors
})

const hasChanges = computed(() => JSON.stringify(normalize(form)) !== JSON.stringify(snapshot.value))
const canSave = computed(() => Object.keys(validation.value).length === 0 && hasChanges.value && !submitting.value)

function reset() {
  if (snapshot.value) Object.assign(form, { ...snapshot.value })
}

function isAuthError(err: any) {
  const status = err?.statusCode || err?.response?.status || err?.status
  return status === 401 || status === 403
}

async function save() {
  if (!canSave.value) return
  submitting.value = true
  try {
    const response = await settingsApi.updateSettings(normalize(form))
    apply(response.setting.value)
    apiClient.notifySuccess('Настройки кэшбэка сохранены')
    await refresh()
  } catch (err: any) {
    if (isAuthError(err)) {
      await sessionStore.logout()
      await navigateTo('/login')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="settings-cashback">
    <template #header>
      <UDashboardNavbar title="Кэшбэк" :ui="{ right: 'gap-3' }">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <template #header>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">Marketplace</p>
            <h2 class="barbershop-heading text-3xl text-charcoal-950">Настройки кэшбэка</h2>
            <p class="mt-2 text-sm text-charcoal-600">После окончания акции автоматически применяется дефолтный процент.</p>
          </template>

          <div v-if="pending" class="py-6 text-sm text-charcoal-600">Загрузка настроек…</div>
          <div v-else class="space-y-6">
            <div class="grid gap-4 md:grid-cols-3">
              <UFormField label="Дефолтный процент" name="default_percent" :error="validation.default_percent">
                <UInput v-model.number="form.default_percent" type="number" min="0" max="100" step="0.1" />
              </UFormField>
              <UFormField label="Процент акции" name="promotion_percent" :error="validation.promotion_percent">
                <UInput v-model.number="form.promotion_percent" type="number" min="0" max="100" step="0.1" placeholder="Например: 2" />
              </UFormField>
              <UFormField label="Timezone">
                <UInput v-model="form.timezone" placeholder="Asia/Tashkent" />
              </UFormField>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <UFormField label="Акция действует с" name="promotion_start_date" :error="validation.promotion_dates">
                <UInput v-model="form.promotion_start_date" type="date" />
              </UFormField>
              <UFormField label="Акция действует по" name="promotion_end_date">
                <UInput v-model="form.promotion_end_date" type="date" />
              </UFormField>
            </div>
            <p v-if="error" class="text-sm text-red-600">Не удалось загрузить настройки кэшбэка.</p>
            <div class="flex flex-wrap gap-3">
              <UButton :disabled="!canSave" :loading="submitting" color="primary" @click="save">Сохранить</UButton>
              <UButton :disabled="!hasChanges || submitting" color="neutral" variant="outline" @click="reset">Сбросить изменения</UButton>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
