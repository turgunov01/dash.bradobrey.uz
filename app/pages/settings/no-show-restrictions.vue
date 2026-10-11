<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'
import type { NoShowRestrictionSettings } from '~/composables/useNoShowRestrictionSettingsApi'

definePageMeta({ alias: '/dashboard/marketplace/no-show-restrictions' })

type DurationKey = 'first_violation_minutes' | 'second_violation_minutes' | 'third_plus_violation_minutes'
type DurationUnit = 'minutes' | 'hours' | 'days'

const api = useNoShowRestrictionSettingsApi()
const apiClient = useApiClient()
const MAX_DURATION_MINUTES = 43200

const defaults: NoShowRestrictionSettings = {
  enabled: true,
  automatic: true,
  first_violation_minutes: 1440,
  second_violation_minutes: 4320,
  third_plus_violation_minutes: 10080,
  lookback_days: 365
}

const durationFields: Array<{ key: DurationKey, level: string, title: string, description: string }> = [
  { key: 'first_violation_minutes', level: '01', title: 'Первая неявка', description: 'Первое подтверждённое нарушение за период учёта.' },
  { key: 'second_violation_minutes', level: '02', title: 'Вторая неявка', description: 'Применяется после повторной подтверждённой неявки.' },
  { key: 'third_plus_violation_minutes', level: '03+', title: 'Третья и последующие', description: 'Правило для третьего и всех следующих нарушений.' }
]

const unitItems = [
  { label: 'Минуты', value: 'minutes' },
  { label: 'Часы', value: 'hours' },
  { label: 'Дни', value: 'days' }
]
const unitFactors: Record<DurationUnit, number> = { minutes: 1, hours: 60, days: 1440 }
const unitShortLabels: Record<DurationUnit, string> = { minutes: 'мин', hours: 'ч', days: 'дн' }

function copySettings(value: Partial<NoShowRestrictionSettings>): NoShowRestrictionSettings {
  return {
    enabled: Boolean(value.enabled),
    automatic: Boolean(value.automatic),
    first_violation_minutes: Number(value.first_violation_minutes),
    second_violation_minutes: Number(value.second_violation_minutes),
    third_plus_violation_minutes: Number(value.third_plus_violation_minutes),
    lookback_days: Number(value.lookback_days),
    ...(value.updated_at ? { updated_at: String(value.updated_at) } : {})
  }
}

const form = reactive<NoShowRestrictionSettings>(copySettings(defaults))
const durationUnits = reactive<Record<DurationKey, DurationUnit>>({
  first_violation_minutes: 'days', second_violation_minutes: 'days', third_plus_violation_minutes: 'days'
})
const durationInputs = reactive<Record<DurationKey, number | null>>({
  first_violation_minutes: 1, second_violation_minutes: 3, third_plus_violation_minutes: 7
})
const durationWarnings = reactive<Record<DurationKey, string>>({
  first_violation_minutes: '', second_violation_minutes: '', third_plus_violation_minutes: ''
})

const snapshot = shallowRef<NoShowRestrictionSettings | null>(null)
const updatedAt = ref<string | null>(null)
const submitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const { data, pending, error, refresh } = await useAsyncData('settings-no-show-restrictions', async () => await api.getSettings())

function inferUnit(minutes: number): DurationUnit {
  if (minutes >= 1440 && minutes % 1440 === 0) return 'days'
  if (minutes >= 60 && minutes % 60 === 0) return 'hours'
  return 'minutes'
}

function toDisplayValue(minutes: number, unit: DurationUnit) {
  return Number((minutes / unitFactors[unit]).toFixed(6))
}

function syncDurationInputs() {
  for (const field of durationFields) {
    const minutes = Number(form[field.key])
    const unit = inferUnit(minutes)
    durationUnits[field.key] = unit
    durationInputs[field.key] = Number.isFinite(minutes) ? toDisplayValue(minutes, unit) : null
  }
}

function applySettings(value: NoShowRestrictionSettings | undefined, updated?: string | null) {
  if (!value) return
  const normalized = copySettings(value)
  Object.assign(form, normalized)
  snapshot.value = normalized
  updatedAt.value = updated || normalized.updated_at || null
  syncDurationInputs()
  for (const field of durationFields) durationWarnings[field.key] = ''
  successMessage.value = ''
  errorMessage.value = ''
}

watch(data, (value) => applySettings(value?.settings, value?.updated_at), { immediate: true })

function onDurationInput(key: DurationKey, value: unknown) {
  const raw = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'))
  if (!Number.isFinite(raw)) {
    durationInputs[key] = null
    form[key] = Number.NaN
    return
  }
  durationWarnings[key] = ''
  durationInputs[key] = raw
  form[key] = Math.round(raw * unitFactors[durationUnits[key]])
  durationInputs[key] = toDisplayValue(form[key], durationUnits[key])
}

function setDurationUnit(key: DurationKey, unit: string) {
  const nextUnit = unit as DurationUnit
  if (!(nextUnit in unitFactors)) return
  const minutes = Number(form[key])
  const factor = unitFactors[nextUnit]
  if (Number.isFinite(minutes) && factor > 1 && minutes % factor !== 0) {
    const normalizedValue = Math.max(1, Math.round(minutes / factor))
    durationUnits[key] = nextUnit
    durationInputs[key] = normalizedValue
    form[key] = normalizedValue * factor
    durationWarnings[key] = `Текущее значение ${minutes} мин приведено к ${normalizedValue} ${nextUnit === 'days' ? 'дн.' : 'ч.'}. Проверьте перед сохранением.`
    return
  }
  durationUnits[key] = nextUnit
  durationInputs[key] = Number.isFinite(minutes) ? toDisplayValue(minutes, nextUnit) : null
  durationWarnings[key] = ''
}

function durationSummary(minutes: number) {
  if (!Number.isFinite(minutes)) return 'Укажите длительность'
  if (minutes % 1440 === 0) return `${minutes / 1440} ${unitShortLabels.days}`
  if (minutes % 60 === 0) return `${minutes / 60} ${unitShortLabels.hours}`
  return `${minutes} ${unitShortLabels.minutes}`
}

const validationErrors = computed(() => {
  const errors: string[] = []
  for (const [key, label] of [['first_violation_minutes', 'Первая неявка'], ['second_violation_minutes', 'Вторая неявка'], ['third_plus_violation_minutes', 'Третья и последующие неявки']] as const) {
    const value = Number(form[key])
    if (!Number.isSafeInteger(value) || value < 1 || value > MAX_DURATION_MINUTES) errors.push(`${label}: от 1 минуты до 30 дней`)
  }
  const lookback = Number(form.lookback_days)
  if (!Number.isSafeInteger(lookback) || lookback < 1 || lookback > 3650) errors.push('Период учёта: от 1 до 3650 дней')
  return errors
})

const hasChanges = computed(() => JSON.stringify(form) !== JSON.stringify(snapshot.value))
const canSave = computed(() => !pending.value && !submitting.value && hasChanges.value && !validationErrors.value.length)

function resetChanges() {
  if (!snapshot.value) return
  Object.assign(form, copySettings(snapshot.value))
  syncDurationInputs()
  for (const field of durationFields) durationWarnings[field.key] = ''
  successMessage.value = ''
  errorMessage.value = ''
}

async function submit() {
  if (!canSave.value) return
  submitting.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const response = await api.updateSettings({
      ...form,
      first_violation_minutes: Number(form.first_violation_minutes),
      second_violation_minutes: Number(form.second_violation_minutes),
      third_plus_violation_minutes: Number(form.third_plus_violation_minutes),
      lookback_days: Number(form.lookback_days)
    })
    applySettings(response.setting.value, response.setting.updated_at || new Date().toISOString())
    successMessage.value = 'Настройки ограничений сохранены'
    apiClient.notifySuccess(successMessage.value)
  } catch (err: any) {
    errorMessage.value = err?.data?.error || err?.message || 'Не удалось сохранить настройки'
    apiClient.notifyError(err)
  } finally {
    submitting.value = false
  }
}

function formatUpdatedAt(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

onBeforeRouteLeave(() => {
  if (hasChanges.value && !submitting.value && !window.confirm('Есть несохранённые изменения. Покинуть страницу?')) return false
})
</script>

<template>
  <UDashboardPanel id="settings-no-show-restrictions">
    <template #header>
      <UDashboardNavbar title="Ограничения за неявку">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="mx-auto w-full max-w-6xl space-y-6 pb-8">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">Marketplace · Безопасность</p>
          <h1 class="barbershop-heading text-3xl text-charcoal-950 sm:text-4xl">Ограничения за неявку</h1>
          <p class="max-w-2xl text-sm leading-6 text-charcoal-600">Управляйте временными ограничениями для клиентов, которые не пришли на подтверждённую запись.</p>
        </div>
        <div class="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <UIcon name="i-lucide-info" class="mt-0.5 size-5 shrink-0 text-sky-700" />
          <p>Ограничивается только создание новых записей. Вход, каталог и история остаются доступными.</p>
        </div>

        <div v-if="pending" class="space-y-4" aria-label="Загрузка настроек">
          <USkeleton class="h-48 w-full rounded-[1.5rem]" />
          <USkeleton class="h-72 w-full rounded-[1.5rem]" />
        </div>
        <div v-else-if="error || !data" class="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <p class="font-semibold">Не удалось загрузить настройки.</p>
          <p class="mt-1">Проверьте соединение и попробуйте ещё раз.</p>
          <UButton class="mt-4" color="neutral" variant="outline" @click="refresh()">Повторить</UButton>
        </div>

        <div v-else class="space-y-6">
          <UCard class="warm-card rounded-[1.5rem] border border-charcoal-200">
            <template #header>
              <div class="flex items-start justify-between gap-4">
                <div><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">Общие параметры</p><h2 class="barbershop-heading mt-1 text-2xl text-charcoal-950">Состояние механизма</h2></div>
                <UIcon name="i-lucide-settings-2" class="size-6 text-charcoal-400" />
              </div>
            </template>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-2xl border border-charcoal-200 bg-white/70 p-4"><div class="flex items-center justify-between gap-4"><div><p class="font-semibold text-charcoal-950">Механизм включён</p><p class="mt-1 text-sm leading-5 text-charcoal-600">Правила учитываются при проверке новых записей.</p></div><USwitch v-model="form.enabled" aria-label="Механизм включён" /></div></div>
              <div class="rounded-2xl border border-charcoal-200 bg-white/70 p-4"><div class="flex items-center justify-between gap-4"><div><p class="font-semibold text-charcoal-950">Автоматически применять блокировку</p><p class="mt-1 text-sm leading-5 text-charcoal-600">Блокировать клиента сразу после подтверждённой неявки.</p></div><USwitch v-model="form.automatic" aria-label="Автоматически применять блокировку" /></div></div>
            </div>
          </UCard>

          <UCard class="warm-card rounded-[1.5rem] border border-charcoal-200">
            <template #header><div><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">Правила блокировки</p><h2 class="barbershop-heading mt-1 text-2xl text-charcoal-950">Длительность ограничений</h2><p class="mt-2 text-sm text-charcoal-600">Значения сохраняются в Backend в минутах. Единицы ниже влияют только на отображение.</p></div></template>
            <div class="grid gap-4 xl:grid-cols-3">
              <div v-for="field in durationFields" :key="field.key" class="rounded-2xl border border-charcoal-200 bg-white p-4 text-charcoal-950 shadow-sm">
                <div class="flex items-start gap-3"><span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-charcoal-950 text-xs font-bold text-white">{{ field.level }}</span><div><h3 class="font-semibold text-charcoal-950">{{ field.title }}</h3><p class="mt-1 min-h-10 text-sm leading-5 text-charcoal-600">{{ field.description }}</p></div></div>
                <div class="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
                  <label class="min-w-0"><span class="mb-1 block text-xs font-medium text-charcoal-500">Значение</span><UInput :model-value="durationInputs[field.key]" type="number" inputmode="numeric" min="1" :max="Math.floor(MAX_DURATION_MINUTES / unitFactors[durationUnits[field.key]])" step="1" :aria-label="`${field.title}: значение`" @update:model-value="onDurationInput(field.key, $event)" /></label>
                  <label class="min-w-0"><span class="mb-1 block text-xs font-medium text-charcoal-500">Единица</span><USelect v-model="durationUnits[field.key]" :items="unitItems" :aria-label="`${field.title}: единица измерения`" @update:model-value="setDurationUnit(field.key, $event)" /></label>
                </div>
                <p class="mt-3 text-xs font-medium text-charcoal-500">Итоговая длительность: {{ durationSummary(Number(form[field.key])) }}</p>
                <p v-if="durationWarnings[field.key]" class="mt-2 text-xs leading-4 text-amber-700">{{ durationWarnings[field.key] }}</p>
              </div>
            </div>
          </UCard>

          <UCard class="warm-card rounded-[1.5rem] border border-charcoal-200">
            <template #header><div><p class="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-500">Период учёта</p><h2 class="barbershop-heading mt-1 text-2xl text-charcoal-950">Сколько времени учитывать нарушения</h2></div></template>
            <div class="max-w-md"><UFormField label="Период учёта нарушений" help="Нарушения за пределами выбранного периода не учитываются при определении уровня блокировки."><div class="flex items-center gap-3"><UInput v-model.number="form.lookback_days" type="number" inputmode="numeric" min="1" max="3650" step="1" class="max-w-40" /><span class="text-sm font-medium text-charcoal-600">дней</span></div></UFormField></div>
          </UCard>

          <div class="sticky bottom-4 z-10 rounded-2xl border border-charcoal-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div class="flex items-center gap-2 text-sm"><span class="size-2 rounded-full" :class="hasChanges ? 'bg-amber-500' : 'bg-emerald-500'" /><span class="text-charcoal-700">{{ hasChanges ? 'Есть несохранённые изменения' : 'Все изменения сохранены' }}</span></div><div class="flex flex-wrap gap-3"><UButton color="neutral" variant="outline" :disabled="!hasChanges || submitting" @click="resetChanges">Сбросить изменения</UButton><UButton :disabled="!canSave" :loading="submitting" @click="submit">Сохранить изменения</UButton></div></div>
            <p v-if="validationErrors.length" class="mt-3 text-sm text-red-700">Проверьте значения: {{ validationErrors.join(' · ') }}</p>
            <p v-if="successMessage" role="status" class="mt-3 text-sm text-emerald-700">{{ successMessage }}</p>
            <p v-if="errorMessage" role="alert" class="mt-3 text-sm text-red-700">{{ errorMessage }}</p>
          </div>
        </div>
        <p class="text-xs text-charcoal-500">Последнее обновление: {{ formatUpdatedAt(updatedAt) }}</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
