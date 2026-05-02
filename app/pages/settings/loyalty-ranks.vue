<script setup lang="ts">
import type { LoyaltyRanksSettings } from '~/composables/useLoyaltyRanksSettingsApi'

definePageMeta({})

const apiClient = useApiClient()
const ranksApi = useLoyaltyRanksSettingsApi()
const sessionStore = useSessionStore()

const submitting = ref(false)

const form = reactive({
  bronze_min_visits: '',
  silver_min_visits: '',
  gold_min_visits: ''
})

const snapshot = ref<Pick<LoyaltyRanksSettings, 'bronze_min_visits' | 'silver_min_visits' | 'gold_min_visits' | 'updated_at'> | null>(null)

function parsePositiveInt(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  const num = Number(trimmed)
  if (!Number.isInteger(num) || num <= 0) return null

  return num
}

function getValidation() {
  const bronze = parsePositiveInt(form.bronze_min_visits)
  const silver = parsePositiveInt(form.silver_min_visits)
  const gold = parsePositiveInt(form.gold_min_visits)

  const errors = {
    bronze_min_visits: bronze == null ? 'Введите целое число больше 0' : '',
    silver_min_visits: silver == null ? 'Введите целое число больше 0' : '',
    gold_min_visits: gold == null ? 'Введите целое число больше 0' : ''
  }

  if (bronze != null && silver != null && silver <= bronze) {
    errors.silver_min_visits = 'Должно быть больше, чем для Бронзы'
  }

  if (silver != null && gold != null && gold <= silver) {
    errors.gold_min_visits = 'Должно быть больше, чем для Серебра'
  }

  const hasErrors = Boolean(errors.bronze_min_visits || errors.silver_min_visits || errors.gold_min_visits)

  return {
    errors,
    parsed: hasErrors ? null : ({ bronze, silver, gold } as { bronze: number, silver: number, gold: number })
  }
}

function applySettings(settings: LoyaltyRanksSettings | null | undefined) {
  if (!settings) return

  snapshot.value = {
    bronze_min_visits: Number(settings.bronze_min_visits ?? 0),
    gold_min_visits: Number(settings.gold_min_visits ?? 0),
    silver_min_visits: Number(settings.silver_min_visits ?? 0),
    updated_at: String(settings.updated_at || '')
  }

  form.bronze_min_visits = String(snapshot.value.bronze_min_visits || '')
  form.silver_min_visits = String(snapshot.value.silver_min_visits || '')
  form.gold_min_visits = String(snapshot.value.gold_min_visits || '')
}

const { data, pending, refresh, error } = await useAsyncData('settings-loyalty-ranks', async () => {
  return await ranksApi.getSettings()
})

watch(
  () => data.value?.settings,
  (settings) => applySettings(settings),
  { immediate: true }
)

function formatUpdatedAt(value: string | null | undefined) {
  const raw = String(value || '').trim()
  if (!raw) return '—'

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const updatedAtLabel = computed(() => formatUpdatedAt(snapshot.value?.updated_at))

const validation = computed(() => getValidation())

const hasChanges = computed(() => {
  const base = snapshot.value
  if (!base) return false

  return (
    form.bronze_min_visits.trim() !== String(base.bronze_min_visits)
    || form.silver_min_visits.trim() !== String(base.silver_min_visits)
    || form.gold_min_visits.trim() !== String(base.gold_min_visits)
  )
})

const effectiveChanges = computed(() => {
  const current = validation.value.parsed
  const base = snapshot.value
  if (!current || !base) return false

  return (
    current.bronze !== base.bronze_min_visits
    || current.silver !== base.silver_min_visits
    || current.gold !== base.gold_min_visits
  )
})

const canSave = computed(() => Boolean(validation.value.parsed) && effectiveChanges.value && !submitting.value)

function resetChanges() {
  if (!snapshot.value) return

  form.bronze_min_visits = String(snapshot.value.bronze_min_visits || '')
  form.silver_min_visits = String(snapshot.value.silver_min_visits || '')
  form.gold_min_visits = String(snapshot.value.gold_min_visits || '')
}

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

watch(error, (err) => {
  if (err) {
    handleAuthError(err)
  }
})

async function submit() {
  const parsed = validation.value.parsed

  if (!parsed) {
    apiClient.notifyError(new Error('Проверьте поля формы'))
    return
  }

  submitting.value = true

  try {
    const response = await ranksApi.updateSettings({
      bronze_min_visits: parsed.bronze,
      silver_min_visits: parsed.silver,
      gold_min_visits: parsed.gold
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
  <UDashboardPanel id="settings-loyalty-ranks">
    <template #header>
      <UDashboardNavbar title="Ранги клиентов" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <template #header>
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">
                Настройки лояльности
              </p>
              <h2 class="barbershop-heading text-3xl text-charcoal-950">
                Порог посещений для рангов
              </h2>
            </div>
          </template>

          <div v-if="pending" class="py-6 text-sm text-charcoal-600">
            Загрузка настроек…
          </div>

          <div v-else class="space-y-6">
            <div class="grid gap-4 md:grid-cols-3">
              <UFormField label="Посещений до Бронзы" name="bronze_min_visits" :error="validation.errors.bronze_min_visits">
                <UInput
                  v-model="form.bronze_min_visits"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  step="1"
                  placeholder="Например: 3"
                />
              </UFormField>

              <UFormField label="Посещений до Серебра" name="silver_min_visits" :error="validation.errors.silver_min_visits">
                <UInput
                  v-model="form.silver_min_visits"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  step="1"
                  placeholder="Например: 7"
                />
              </UFormField>

              <UFormField label="Посещений до Голда" name="gold_min_visits" :error="validation.errors.gold_min_visits">
                <UInput
                  v-model="form.gold_min_visits"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  step="1"
                  placeholder="Например: 12"
                />
              </UFormField>
            </div>

            <div class="flex flex-wrap gap-3">
              <UButton :disabled="!canSave" :loading="submitting" color="primary" @click="submit">
                Сохранить
              </UButton>

              <UButton
                :disabled="!hasChanges || submitting"
                color="neutral"
                variant="outline"
                @click="resetChanges"
              >
                Сбросить изменения
              </UButton>
            </div>
          </div>

          <template #footer>
            <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-600">
              <span>Последнее обновление: {{ updatedAtLabel }}</span>
              <span v-if="pending" class="text-charcoal-500">…</span>
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
