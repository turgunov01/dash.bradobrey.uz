<script setup lang="ts">
import type { LoyaltyRank, LoyaltyRanksSettings } from '~/composables/useLoyaltyRanksSettingsApi'

definePageMeta({ alias: '/dashboard/marketplace/loyalty-ranks' })

const apiClient = useApiClient()
const ranksApi = useLoyaltyRanksSettingsApi()
const sessionStore = useSessionStore()
const submitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const levels = ref<LoyaltyRank[]>([])
const snapshot = ref<LoyaltyRanksSettings | null>(null)

const { data, pending, refresh, error } = await useAsyncData('settings-loyalty-ranks', async () => {
  return await ranksApi.getSettings()
}, { server: false })

function applySettings(settings: LoyaltyRanksSettings | null | undefined) {
  if (!settings?.levels?.length) return
  snapshot.value = structuredClone(settings)
  levels.value = structuredClone(settings.levels)
}

watch(() => data.value?.settings, applySettings, { immediate: true })

const validationErrors = computed(() => {
  const errors: string[] = []
  if (levels.value.length === 0) errors.push('Добавьте хотя бы один статус')
  if (levels.value.length && Number(levels.value[0]?.min_points) !== 0) {
    errors.push('Первый статус должен начинаться с 0 баллов')
  }
  const names = new Set<string>()
  levels.value.forEach((level, index) => {
    const name = String(level.name || '').trim()
    if (!name || name.length > 40 || !/^[\p{L}\p{N}_ -]+$/u.test(name)) {
      errors.push(`Статус ${index + 1}: укажите название до 40 символов`)
    } else if (names.has(name.toLocaleLowerCase())) {
      errors.push(`Название «${name}» повторяется`)
    } else {
      names.add(name.toLocaleLowerCase())
    }
    const min = Number(level.min_points)
    if (!Number.isSafeInteger(min) || min < 0) errors.push(`Статус ${name || index + 1}: порог должен быть целым числом от 0`)
    if (index > 0 && min <= Number(levels.value[index - 1]?.min_points)) {
      errors.push(`Статус ${name || index + 1}: порог должен быть выше предыдущего`)
    }
    const cashback = Number(level.cashback_percent)
    if (!Number.isFinite(cashback) || cashback < 0 || cashback > 100) {
      errors.push(`Статус ${name || index + 1}: cashback должен быть от 0 до 100%`)
    }
    for (const [field, label] of [['cancel_penalty_points', 'штраф за отмену'], ['no_show_penalty_points', 'штраф за неявку']] as const) {
      const penalty = Number(level[field])
      if (!Number.isSafeInteger(penalty) || penalty < 0) errors.push(`Статус ${name || index + 1}: ${label} должен быть целым числом от 0`)
    }
  })
  return [...new Set(errors)]
})

const hasChanges = computed(() => JSON.stringify(levels.value) !== JSON.stringify(snapshot.value?.levels || []))
const canSave = computed(() => !pending.value && !submitting.value && hasChanges.value && validationErrors.value.length === 0)

function addLevel() {
  const last = levels.value.at(-1)
  levels.value.push({
    name: 'NEW_RANK',
    min_points: Number(last?.min_points || 0) + 100,
    cashback_percent: Number(last?.cashback_percent || 0),
    cancel_penalty_points: Number(last?.cancel_penalty_points ?? 10),
    no_show_penalty_points: Number(last?.no_show_penalty_points ?? 30)
  })
  successMessage.value = ''
}

function resetChanges() {
  if (snapshot.value) levels.value = structuredClone(snapshot.value.levels)
  successMessage.value = ''
  errorMessage.value = ''
}

function isAuthError(err: any) {
  const status = err?.statusCode || err?.response?.status || err?.status
  return status === 401 || status === 403
}

async function handleAuthError(err: any) {
  if (!isAuthError(err)) return
  try { await sessionStore.logout() }
  finally { await navigateTo('/login') }
}

watch(error, (err) => { if (err) handleAuthError(err) })

async function submit() {
  if (validationErrors.value.length) return
  submitting.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const response = await ranksApi.updateSettings(levels.value.map(level => ({
      name: level.name.trim(),
      min_points: Number(level.min_points),
      cashback_percent: Number(level.cashback_percent),
      cancel_penalty_points: Number(level.cancel_penalty_points),
      no_show_penalty_points: Number(level.no_show_penalty_points)
    })))
    applySettings(response?.settings)
    successMessage.value = 'Настройки рангов сохранены'
    apiClient.notifySuccess(successMessage.value)
    await refresh()
  } catch (err: any) {
    await handleAuthError(err)
    errorMessage.value = err?.data?.error || err?.message || 'Не удалось сохранить настройки'
    apiClient.notifyError(err)
  } finally {
    submitting.value = false
  }
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
</script>

<template>
  <UDashboardPanel id="settings-loyalty-ranks">
    <template #header>
      <UDashboardNavbar title="Ранги клиентов" :ui="{ right: 'gap-3' }">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard class="warm-card rounded-[1.9rem] border border-charcoal-200">
          <template #header>
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal-500">Настройки лояльности</p>
              <h2 class="barbershop-heading text-3xl text-charcoal-950">Пороги статусов по баллам</h2>
              <p class="text-sm text-charcoal-600">Статус клиента автоматически рассчитывается по балансу баллов в API.</p>
            </div>
          </template>

          <div v-if="pending" class="py-6 text-sm text-charcoal-600">Загрузка настроек…</div>
          <div v-else-if="error && !snapshot" class="space-y-3 py-6 text-sm text-red-700">
            <p>Не удалось загрузить настройки рангов.</p>
            <UButton color="neutral" variant="outline" @click="refresh()">Повторить</UButton>
          </div>
          <div v-else class="space-y-5">
            <div v-for="(level, index) in levels" :key="index" class="grid items-end gap-4 rounded-2xl border border-charcoal-200 p-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto]">
              <UFormField label="Название статуса" :name="`level-${index}-name`">
                <UInput v-model="level.name" maxlength="40" placeholder="Например: SILVER" />
              </UFormField>
              <UFormField label="Минимум баллов" :name="`level-${index}-min`">
                <UInput v-model.number="level.min_points" type="number" inputmode="numeric" min="0" step="1" :disabled="index === 0" />
              </UFormField>
              <UFormField label="Cashback, %" :name="`level-${index}-cashback`">
                <UInput v-model.number="level.cashback_percent" type="number" inputmode="decimal" min="0" max="100" step="0.1" />
              </UFormField>
              <UFormField label="Списание за отмену, баллов" :name="`level-${index}-cancel-penalty`">
                <UInput v-model.number="level.cancel_penalty_points" type="number" inputmode="numeric" min="0" step="1" />
              </UFormField>
              <UFormField label="Списание за неявку, баллов" :name="`level-${index}-no-show-penalty`">
                <UInput v-model.number="level.no_show_penalty_points" type="number" inputmode="numeric" min="0" step="1" />
              </UFormField>
              <UButton v-if="index > 0" color="error" variant="ghost" :disabled="submitting" @click="levels.splice(index, 1)">Удалить</UButton>
              <span v-else class="pb-2 text-xs text-charcoal-500">Начальный уровень</span>
            </div>

            <ul v-if="validationErrors.length" class="list-inside list-disc space-y-1 text-sm text-red-700">
              <li v-for="message in validationErrors" :key="message">{{ message }}</li>
            </ul>
            <p v-if="successMessage" role="status" class="text-sm text-green-700">{{ successMessage }}</p>
            <p v-if="errorMessage" role="alert" class="text-sm text-red-700">{{ errorMessage }}</p>

            <div class="flex flex-wrap gap-3">
              <UButton color="neutral" variant="outline" :disabled="submitting" @click="addLevel">Добавить статус</UButton>
              <UButton :disabled="!canSave" :loading="submitting" @click="submit">Сохранить</UButton>
              <UButton color="neutral" variant="outline" :disabled="!hasChanges || submitting" @click="resetChanges">Сбросить изменения</UButton>
            </div>
          </div>

          <template #footer>
            <div class="text-xs text-charcoal-600">Последнее обновление: {{ formatUpdatedAt(snapshot?.updated_at) }}</div>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
