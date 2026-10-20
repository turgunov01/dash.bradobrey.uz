<script setup lang="ts">
import type { ZodIssue } from 'zod'

import { getEffectiveEmployeePermissions } from '~~/shared/auth/employees'
import { loginSchema, type LoginLocation } from '~~/shared/schemas'
import { firstAllowedPath } from '~/utils/access'

const apiClient = useApiClient()

definePageMeta({
  layout: 'auth',
  middleware: 'guest-only'
})

const branchStore = useBranchStore()
const sessionStore = useSessionStore()

const form = reactive({
  branch_id: undefined as string | undefined,
  login: '',
  password: ''
})

const branchOptions = ref<Array<{ id: string; name: string }>>([])

const fieldErrors = reactive({
  login: '',
  password: ''
})

const loading = ref(false)

function getLoginLocation(): Promise<LoginLocation | null> {
  if (!import.meta.client || !navigator.geolocation) {
    return Promise.resolve(null)
  }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        accuracy_meters: position.coords.accuracy,
        client_event_id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        measured_at: new Date(position.timestamp).toISOString()
      }),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 7_000 }
    )
  })
}

function resetFieldErrors() {
  fieldErrors.login = ''
  fieldErrors.password = ''
}

function sanitizeDebugValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeDebugValue(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        /password|token|authorization/i.test(key) ? '[redacted]' : sanitizeDebugValue(item)
      ])
    )
  }

  return value
}

function getLoginDebugUser(user: any) {
  if (!user) return null

  return {
    branch_id: user.branch_id || null,
    id: user.id || null,
    login: user.login || null,
    marketplace_barbershop_id: user.marketplace_barbershop_id || null,
    role: user.role || null
  }
}

function logLoginDebug(label: string, payload: Record<string, unknown>) {
  if (!import.meta.client || !import.meta.dev) return

  console.log(`[barbers-login-debug:client] ${label}`, sanitizeDebugValue(payload))
}

function applyFieldErrors(issues: ZodIssue[]) {
  resetFieldErrors()

  for (const issue of issues) {
    const field = String(issue.path[0] || '')

    if ((field === 'login' || field === 'password') && !fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }
}

async function submit() {
  resetFieldErrors()

  if (branchOptions.value.length && !form.branch_id) {
    fieldErrors.password = 'Выберите филиал, в котором вы сегодня работаете.'
    return
  }

  const parsed = loginSchema.safeParse(form)

  if (!parsed.success) {
    applyFieldErrors(parsed.error.issues)
    apiClient.notifyError(new Error(parsed.error.issues[0]?.message || 'Некорректные данные для входа'))
    return
  }

  loading.value = true

  try {
    const location = await getLoginLocation()

    logLoginDebug('request', {
      body: {
        branch_id: parsed.data.branch_id || null,
        login: parsed.data.login,
        password: '[redacted]'
      },
      merchantLoginAttempt: !parsed.data.branch_id,
      method: 'POST',
      path: '/api/barbers/login'
    })

    const response = await sessionStore.login({ ...parsed.data, location })

    const sessionBranchId = sessionStore.barber?.branch_id || sessionStore.user?.branch_id || parsed.data.branch_id || null

    if (sessionBranchId) {
      branchStore.setActiveBranch(sessionBranchId)
    }

    const role = String(sessionStore.user?.role || '').trim().toLowerCase()
    const marketplaceBarbershopId = String(sessionStore.user?.marketplace_barbershop_id || '').trim()
    const isMerchant = Boolean(marketplaceBarbershopId) || role === 'merchant' || role === 'partner'
    const redirectTo = isMerchant
      ? '/merchant'
      : firstAllowedPath(new Set(getEffectiveEmployeePermissions(sessionStore.user)))

    if (!redirectTo) {
      await sessionStore.logout(undefined, { silent: true })
      fieldErrors.password = 'Для этой учётной записи не настроены разрешения на разделы панели. Обратитесь к администратору.'
      return
    }

    logLoginDebug('response', {
      authenticated: Boolean(response?.authenticated),
      merchantLogin: isMerchant,
      redirectTo,
      responseUser: getLoginDebugUser(response?.user),
      sessionUser: getLoginDebugUser(sessionStore.user)
    })

    await navigateTo(redirectTo)

  } catch (error: any) {
    logLoginDebug('error', {
      data: error?.data || error?.response?._data || null,
      message: error?.message || null,
      status: error?.statusCode || error?.response?.status || null,
      statusMessage: error?.statusMessage || error?.response?.statusText || null
    })

    const errorBody = error?.data || error?.response?._data
    if (errorBody?.code === 'BRANCH_SELECTION_REQUIRED' && Array.isArray(errorBody.branches)) {
      branchOptions.value = errorBody.branches.filter((branch: any) => branch?.id && branch?.name)
      fieldErrors.password = 'Выберите филиал, в котором вы сегодня работаете.'
      if (!form.branch_id && branchOptions.value.length === 1) form.branch_id = String(branchOptions.value[0]?.id)
      return
    }
    const apiError = errorBody?.data?.error || errorBody?.error || errorBody?.message
    fieldErrors.password = apiError === 'Employee access has been revoked'
      ? 'Доступ сотрудника отозван. Обратитесь к администратору для восстановления.'
      : apiError === 'Invalid credentials'
        ? 'Неверный логин или пароль.'
        : apiError || error?.message || 'Не удалось войти. Повторите попытку.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard
    class="warm-card w-full max-w-md rounded-[1.25rem] border border-charcoal-200 shadow-[0_24px_70px_rgba(18,15,13,0.10)]">
    <form class="space-y-5" @submit.prevent="submit">
      <div class="space-y-1">
        <h1 class="barbershop-heading text-3xl text-charcoal-950">
          Вход
        </h1>
      </div>

      <UFormField label="Логин" name="login" :error="fieldErrors.login">
        <UInput v-model="form.login" autocomplete="username" autofocus class="w-full" placeholder="Введите логин" />
      </UFormField>

      <UFormField label="Пароль" name="password" :error="fieldErrors.password">
        <UInput v-model="form.password" autocomplete="current-password" class="w-full" placeholder="Введите пароль"
          type="password" />
      </UFormField>

      <UFormField v-if="branchOptions.length" label="Рабочий филиал" name="branch_id" :error="fieldErrors.password">
        <USelectMenu
          v-model="form.branch_id"
          :items="branchOptions.map(branch => ({ label: branch.name, value: String(branch.id) }))"
          value-key="value"
          class="w-full"
          placeholder="Выберите филиал" />
      </UFormField>

      <div class="pt-1">
        <UButton block :loading="loading" color="primary" size="lg" type="submit">
          Войти
        </UButton>
      </div>
    </form>
  </UCard>
</template>
