<script setup lang="ts">
import { ru } from '@nuxt/ui/locale'

const colorMode = useColorMode()
const toasterReady = ref(false)

onMounted(() => {
  toasterReady.value = true
})

colorMode.preference = 'light'

const color = computed(() => colorMode.value === 'dark' ? '#120f0d' : '#fbf7f2')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  bodyAttrs: {
    class: 'page-surface'
  }
})

const title = 'Панель Bradobrey'
const description = 'SSR-панель управления для API барбершопа Bradobrey, построенная на Nuxt 4, Nuxt UI и серверном BFF.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: '/favicon.ico',
  twitterImage: '/favicon.ico',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp :locale="ru" :toaster="toasterReady ? { position: 'top-right' } : null">
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
