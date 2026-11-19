<script setup lang="ts">
definePageMeta({ layout: 'platform' })
useHead({ title: 'Владельцы платформы' })
</script>

<template>
  <UDashboardPanel id="platform-owners">
    <template #header>
      <UDashboardNavbar title="Владельцы платформы">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <PlatformOwnersPanel source="platform" />
    </template>
  </UDashboardPanel>
</template>
