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
    await sessionStore.login(parsed.data)

    const sessionBranchId = sessionStore.barber?.branch_id || sessionStore.user?.branch_id || parsed.data.branch_id || null

    if (sessionBranchId) {
      branchStore.setActiveBranch(sessionBranchId)
    }

    const role = String(sessionStore.user?.role || '').trim().toLowerCase()
    await navigateTo(role === 'merchant' || role === 'partner' ? '/merchant' : '/')

  } catch (error: any) {
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
