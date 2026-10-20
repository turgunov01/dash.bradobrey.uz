<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const ROLE_LABELS: Record<string, string> = {
  'admin_network': 'Админ сети',
  'admin_branch': 'Админ филиала',
  'admin': 'Администратор',
  'manager': 'Менеджер',
  'super-manager': 'Супер-менеджер',
  'merchant': 'Мерчант',
  'barber': 'Барбер',
  'super-barber': 'Супер-барбер'
}

const sessionStore = useSessionStore()
const branchStore = useBranchStore()
const { isConnected } = useRealtimeQueue()

const role = computed(() => String(sessionStore.user?.role || '').trim().toLowerCase())

const accountLabel = computed(() => {
  if (sessionStore.user?.name) return sessionStore.user.name
  return ['admin', 'admin_network', 'admin_branch', 'super-manager'].includes(role.value)
    ? 'Администратор'
    : 'Барбер без имени'
})

const roleLabel = computed(() => ROLE_LABELS[role.value] || 'Сотрудник')
const initial = computed(() => accountLabel.value.trim().charAt(0).toUpperCase() || '?')
const syncLabel = computed(() => isConnected.value ? 'Онлайн-синхронизация активна' : 'Онлайн-синхронизация недоступна')

const collapsedItems = computed<DropdownMenuItem[][]>(() => [
  [{ type: 'label', label: `${accountLabel.value} · ${roleLabel.value}` }],
  [
    { label: branchStore.activeBranch?.name || 'Филиал не выбран', icon: 'i-lucide-map-pinned' },
    { label: syncLabel.value, icon: isConnected.value ? 'i-lucide-radio-tower' : 'i-lucide-wifi-off' }
  ],
  [{ label: 'Выйти', icon: 'i-lucide-log-out', onSelect: logout }]
])

async function logout() {
  await sessionStore.logout({
    barber_id: sessionStore.barber?.id
  })

  await navigateTo('/login')
}
</script>

<template>
  <div
    class="flex w-full items-center gap-2.5 rounded-lg border border-default/70 bg-elevated/50"
    :class="collapsed ? 'justify-center border-transparent bg-transparent p-0' : 'px-2.5 py-2'"
  >
    <!-- Collapsed sidebar: the avatar opens a menu so logout stays reachable. -->
    <UDropdownMenu v-if="collapsed" :items="collapsedItems" :content="{ side: 'right', align: 'end' }">
      <button type="button" :aria-label="`${accountLabel} · ${roleLabel}`" class="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-charcoal-900 text-xs font-semibold text-sand-50">
        {{ initial }}
        <span class="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-white" :class="isConnected ? 'bg-success' : 'bg-dimmed'" />
      </button>
    </UDropdownMenu>

    <div v-else class="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-charcoal-900 text-xs font-semibold text-sand-50">
      {{ initial }}
      <span
        class="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-white"
        :class="isConnected ? 'bg-success' : 'bg-dimmed'"
        :title="syncLabel"
      />
    </div>

    <div v-if="!collapsed" class="min-w-0 flex-1">
      <p class="truncate text-sm font-semibold text-highlighted">
        {{ accountLabel }}
      </p>
      <p class="truncate text-xs text-muted">
        {{ roleLabel }}
      </p>
    </div>

    <UTooltip v-if="!collapsed" text="Выйти">
      <UButton aria-label="Выйти" color="neutral" icon="i-lucide-log-out" size="sm" variant="ghost" @click="logout" />
    </UTooltip>
  </div>
</template>
