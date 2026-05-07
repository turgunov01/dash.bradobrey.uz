<script setup lang="ts">
const tabs = [
  { label: 'Барбершопы', value: 'barbershops', to: '/admin/marketplace/barbershops' },
  { label: 'Баннеры', value: 'banners', to: '/admin/marketplace/banners' },
  { label: 'Клиенты', value: 'clients', to: '/admin/marketplace/clients' },
  { label: 'Настройки', value: 'settings', to: '/admin/marketplace/settings' }
]
</script>

<template>
  <MarketplaceLayout :tabs="tabs">
    <NuxtPage />
  </MarketplaceLayout>
</template>
