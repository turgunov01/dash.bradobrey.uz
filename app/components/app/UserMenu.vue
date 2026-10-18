<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const sessionStore = useSessionStore()
const branchStore = useBranchStore()
const { isConnected } = useRealtimeQueue()
const accountLabel = computed(() => {
  const role = String(sessionStore.user?.role || '').trim().toLowerCase()
  if (sessionStore.user?.name) return sessionStore.user.name
  return ['admin', 'admin_network', 'admin_branch', 'super-manager'].includes(role)
    ? 'Администратор'
    : 'Барбер без имени'
})

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: accountLabel.value
    }
  ],
  [
    {
      label: branchStore.activeBranch?.name || 'Филиал не выбран',
      icon: 'i-lucide-map-pinned'
    }, {
      label: isConnected.value ? 'Онлайн-синхронизация активна' : 'Онлайн-синхронизация недоступна',
      icon: isConnected.value ? 'i-lucide-radio-tower' : 'i-lucide-wifi-off'
    }
  ],
  [
    {
      label: 'Выйти',
      icon: 'i-lucide-log-out',
      onSelect: async () => {
        await sessionStore.logout({
          barber_id: sessionStore.barber?.id
        })

        await navigateTo('/login')
      }
    }
  ]
]
)
</script>

<template>
  <UDropdownMenu :content="{ align: 'center', collisionPadding: 12 }" :items="items"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }">
    <UButton :block="!collapsed" :class="[!collapsed && 'py-2.5']" :icon="collapsed ? 'i-lucide-user-round' : undefined"
      :label="collapsed ? undefined : accountLabel" :square="collapsed" color="neutral"
      trailing-icon="i-lucide-chevrons-up-down" variant="ghost" />
  </UDropdownMenu>
</template>
