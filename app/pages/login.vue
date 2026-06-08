<script setup lang="ts">
import type { ZodIssue } from 'zod'

import { loginSchema } from '~~/shared/schemas'

definePageMeta({
  layout: 'auth',
  middleware: 'guest-only'
})

const branchStore = useBranchStore()
const sessionStore = useSessionStore()

const form = reactive({
  login: '',
  password: ''
})

const fieldErrors = reactive({
  login: '',
  password: ''
})

const loading = ref(false)

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
  if (!import.meta.client) return

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

  const parsed = loginSchema.safeParse(form)

  if (!parsed.success) {
    applyFieldErrors(parsed.error.issues)
    useApiClient().notifyError(new Error(parsed.error.issues[0]?.message || 'Некорректные данные для входа'))
    return
  }

  loading.value = true

  try {
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

    const response = await sessionStore.login(parsed.data)

    const sessionBranchId = sessionStore.barber?.branch_id || sessionStore.user?.branch_id || parsed.data.branch_id || null

    if (sessionBranchId) {
      branchStore.setActiveBranch(sessionBranchId)
    }

    const role = String(sessionStore.user?.role || '').trim().toLowerCase()
    const marketplaceBarbershopId = String(sessionStore.user?.marketplace_barbershop_id || '').trim()
    const isMerchant = Boolean(marketplaceBarbershopId) || role === 'merchant' || role === 'partner'
    const redirectTo = isMerchant ? '/merchant' : '/'

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

    fieldErrors.password = error?.statusMessage || error?.message || 'Неверный логин или пароль.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard
    class="warm-card w-full max-w-md rounded-[2.25rem] border border-charcoal-200 shadow-[0_24px_70px_rgba(18,15,13,0.10)]">
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

      <div class="pt-1">
        <UButton block :loading="loading" color="primary" size="lg" type="submit">
          Войти
        </UButton>
      </div>
    </form>
  </UCard>
</template>
