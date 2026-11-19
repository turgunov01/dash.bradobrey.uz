<script setup lang="ts">
// Platform owner: franchise companies (platform-owner session).
definePageMeta({ layout: 'platform' })
useHead({ title: 'Компании' })
</script>

<template>
  <UDashboardPanel id="platform-companies">
    <template #header>
      <UDashboardNavbar title="Компании">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <PlatformCompaniesPanel source="platform" />
    </template>
  </UDashboardPanel>
</template>
