<script setup lang="ts">
import { ru } from '@nuxt/ui/locale'
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const isAccessError = computed(() => [401, 403].includes(Number(props.error?.statusCode || 0)))

function recoverFromError() {
  clearError({ redirect: isAccessError.value ? '/login' : '/' })
}

useSeoMeta({
  title: 'Ошибка панели',
  description: 'Панель не смогла выполнить этот запрос.'
})
</script>

<template>
  <UApp :locale="ru" :toaster="null">
    <div class="min-h-screen bg-[var(--dashboard-shell)] px-4 py-12">
      <div class="mx-auto max-w-xl">
        <UCard class="warm-card rounded-[2rem] border border-charcoal-200">
          <template #header>
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.28em] text-brass-700">
                Панель Bradobrey
              </p>
              <h1 class="barbershop-heading text-3xl text-charcoal-950">
                Что-то пошло не так
              </h1>
            </div>
          </template>

          <div class="space-y-4">
            <UAlert
              color="error"
              icon="i-lucide-triangle-alert"
              title="Ошибка запроса"
              :description="error.message || 'Во время рендеринга панели произошла непредвиденная ошибка.'"
              variant="soft"
            />

            <div class="flex flex-wrap gap-3">
              <UButton v-if="isAccessError" color="primary" @click="recoverFromError">
                Войти заново
              </UButton>
              <UButton v-else color="primary" to="/">
                На главную
              </UButton>
              <UButton color="neutral" variant="outline" @click="recoverFromError">
                Сбросить приложение
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </UApp>
</template>
