<script setup lang="ts">
// Default company's network admins create platform-owner accounts (the
// backend allows admin_network/admin of the default company only; the route
// is offered per canManagePlatform, see shared/auth/tenancy.ts).
definePageMeta({})
useHead({ title: 'Владельцы платформы' })
</script>

<template>
  <UDashboardPanel id="settings-platform-owners">
    <template #header>
      <UDashboardNavbar title="Владельцы платформы">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <PlatformOwnersPanel source="tenant" />
    </template>
  </UDashboardPanel>
</template>
