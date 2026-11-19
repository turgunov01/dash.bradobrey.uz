<script setup lang="ts">
import { getApiErrorStatus } from '~~/shared/auth/tenancy'

definePageMeta({
  layout: 'auth',
  middleware: [
    async () => {
      const platformSession = usePlatformSessionStore()
      await platformSession.ensureLoaded()
      if (platformSession.isAuthenticated) return navigateTo('/platform/companies')
    }
  ]
})

useHead({ title: 'Вход владельца платформы' })

const platformSession = usePlatformSessionStore()

const form = reactive({ login: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''

  if (!form.login.trim() || !form.password) {
    error.value = 'Введите логин и пароль.'
    return
  }

  loading.value = true

  try {
    await platformSession.login({ login: form.login.trim(), password: form.password })
    await navigateTo('/platform/companies')
  }
  catch (loginError) {
    const status = getApiErrorStatus(loginError)
    error.value = status === 400
      ? 'Неверный логин или пароль.'
      : status === 429
        ? 'Слишком много попыток входа. Повторите позже.'
        : 'Не удалось войти. Повторите попытку.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="warm-card w-full max-w-md rounded-[1.25rem] border border-charcoal-200 shadow-[0_24px_70px_rgba(18,15,13,0.10)]">
    <form class="space-y-5" @submit.prevent="submit">
      <div class="space-y-1">
        <h1 class="barbershop-heading text-3xl text-charcoal-950">
          Владелец платформы
        </h1>
        <p class="text-sm text-charcoal-500">
          Управление компаниями-франчайзи. Данные компаний здесь недоступны.
        </p>
      </div>

      <UFormField label="Логин" name="login">
        <UInput v-model="form.login" autocomplete="username" autofocus class="w-full" placeholder="Введите логин" />
      </UFormField>

      <UFormField label="Пароль" name="password" :error="error">
        <UInput v-model="form.password" autocomplete="current-password" class="w-full" placeholder="Введите пароль" type="password" />
      </UFormField>

      <UButton block :loading="loading" color="primary" size="lg" type="submit">
        Войти
      </UButton>

      <p class="text-center text-xs text-charcoal-500">
        <NuxtLink to="/login" class="underline-offset-4 hover:text-charcoal-800 hover:underline">
          Вход сотрудника компании
        </NuxtLink>
      </p>
    </form>
  </UCard>
</template>
