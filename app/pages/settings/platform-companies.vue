<script setup lang="ts">
// Main company's network admins manage franchise companies with their own
// company session (MULTI_TENANCY 12). The backend allows admin_network/admin
// of the active main company only; the route guard uses canManagePlatform.
definePageMeta({})
useHead({ title: 'Компании платформы' })
</script>

<template>
  <UDashboardPanel id="settings-platform-companies">
    <template #header>
      <UDashboardNavbar title="Компании платформы">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <PlatformCompaniesPanel source="tenant" />
    </template>
  </UDashboardPanel>
</template>
