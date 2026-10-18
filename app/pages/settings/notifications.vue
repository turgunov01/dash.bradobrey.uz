<script setup lang="ts">
const {
  disablePush,
  enablePush,
  pushEnabled,
  pushPermission,
  pushSupported,
  pushServiceAvailable,
  pushSupportReason,
  pushStatusMessage,
  pushChecking,
  deviceKind,
  deviceLabel,
  refreshPushState,
  sendTestPush
} = useNotifications()

const processing = ref(false)
const testing = ref(false)

onMounted(() => refreshPushState())

const deviceTitle = computed(() => deviceKind.value === 'computer'
  ? 'Уведомления на компьютере'
  : deviceKind.value === 'tablet' ? 'Уведомления на планшете' : 'Уведомления на телефоне')
const deviceStatus = computed(() => {
  if (pushChecking.value) return 'Проверяем возможности браузера и регистрацию текущего устройства.'
  if (!pushSupported.value) return pushSupportReason.value
  if (pushServiceAvailable.value !== true) return pushStatusMessage.value || 'Проверяем доступность сервера push-уведомлений.'
  if (pushPermission.value === 'denied') return 'Разрешение запрещено в настройках браузера. Разрешите уведомления и обновите страницу.'
  if (pushEnabled.value) return `Текущий браузер зарегистрирован на ${deviceLabel.value}.`
  if (pushPermission.value === 'granted') return pushStatusMessage.value || 'Разрешение выдано, но устройство не зарегистрировано на сервере.'
  return `Подключите push-уведомления в браузере на этом ${deviceLabel.value}.`
})

async function enableNotifications() {
  processing.value = true
  try {
    await enablePush()
  }
  finally {
    processing.value = false
  }
}

async function disableNotifications() {
  processing.value = true
  try {
    await disablePush()
  }
  finally {
    processing.value = false
  }
}

async function testNotifications() {
  testing.value = true
  try {
    await sendTestPush()
  }
  finally {
    testing.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="settings-notifications">
    <template #header>
      <UDashboardNavbar title="Настройки уведомлений">
        <template #leading><UDashboardSidebarCollapse /></template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="max-w-3xl space-y-6">
        <div>
          <h1 class="text-2xl font-semibold text-charcoal-950">Уведомления</h1>
          <p class="mt-1 text-sm text-charcoal-500">Проверка и подключение push-уведомлений для текущего устройства.</p>
        </div>

        <UCard>
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-3">
              <span class="rounded-full p-2" :class="pushEnabled ? 'bg-green-100 text-green-700' : 'bg-charcoal-100 text-charcoal-500'">
                <UIcon :name="pushEnabled ? 'i-lucide-bell-ring' : 'i-lucide-bell-off'" class="size-5" />
              </span>
              <div>
                <p class="font-medium text-charcoal-950">{{ pushEnabled ? deviceTitle + ' подключены' : deviceTitle }}</p>
                <p class="mt-1 text-sm text-charcoal-500">
                  {{ deviceStatus }}
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton v-if="pushSupported && pushServiceAvailable === true && pushPermission !== 'denied'" color="primary" :loading="processing" :disabled="pushChecking" icon="i-lucide-bell-ring" @click="enableNotifications">
                {{ pushEnabled ? 'Перерегистрировать' : pushPermission === 'granted' ? 'Зарегистрировать устройство' : 'Включить уведомления здесь' }}
              </UButton>
              <UButton v-if="pushSupported && pushServiceAvailable === true && pushEnabled" color="neutral" variant="outline" :loading="processing" icon="i-lucide-bell-off" @click="disableNotifications">
                Выключить
              </UButton>
              <UButton v-if="pushSupported && pushServiceAvailable === true" color="neutral" variant="outline" :loading="testing" :disabled="pushPermission !== 'granted' || pushChecking" icon="i-lucide-send" @click="testNotifications">
                Проверить
              </UButton>
            </div>
          </div>
        </UCard>

        <UAlert
          icon="i-lucide-info"
          color="primary"
          variant="soft"
          title="О регистрации устройства"
          description="Настройка и тест относятся только к этому браузеру. Другой браузер, компьютер или телефон регистрируется отдельно; ранее подключённые устройства продолжают получать общие уведомления."
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
