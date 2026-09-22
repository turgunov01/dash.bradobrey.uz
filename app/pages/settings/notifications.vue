<script setup lang="ts">
const {
  disablePush,
  enablePush,
  pushEnabled,
  pushPermission,
  pushSupported,
  refreshPushState,
  sendTestPush
} = useNotifications()

const processing = ref(false)
const testing = ref(false)

onMounted(() => refreshPushState())

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
          <p class="mt-1 text-sm text-charcoal-500">Подключение push-уведомлений для этого мобильного телефона.</p>
        </div>

        <UCard>
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-3">
              <span class="rounded-full p-2" :class="pushEnabled ? 'bg-green-100 text-green-700' : 'bg-charcoal-100 text-charcoal-500'">
                <UIcon :name="pushEnabled ? 'i-lucide-bell-ring' : 'i-lucide-bell-off'" class="size-5" />
              </span>
              <div>
                <p class="font-medium text-charcoal-950">{{ pushEnabled ? 'Уведомления подключены' : 'Уведомления выключены' }}</p>
                <p class="mt-1 text-sm text-charcoal-500">
                  {{ pushSupported ? (pushPermission === 'denied' ? 'Разрешение запрещено в настройках браузера.' : 'Настройка действует только для текущего устройства.') : 'Этот браузер не поддерживает push-уведомления.' }}
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton v-if="pushSupported" color="primary" :loading="processing" icon="i-lucide-bell-ring" @click="enableNotifications">
                {{ pushEnabled ? 'Перерегистрировать' : 'Включить уведомления' }}
              </UButton>
              <UButton v-if="pushSupported && pushEnabled" color="neutral" variant="outline" :loading="processing" icon="i-lucide-bell-off" @click="disableNotifications">
                Выключить
              </UButton>
              <UButton v-if="pushSupported && pushEnabled" color="neutral" variant="outline" :loading="testing" icon="i-lucide-send" @click="testNotifications">
                Проверить
              </UButton>
            </div>
          </div>
        </UCard>

        <UAlert
          icon="i-lucide-info"
          color="primary"
          variant="soft"
          title="Как подключить телефон"
          description="На Android разрешите уведомления в Chrome. На iPhone сначала добавьте dashboard на экран «Домой», затем откройте его с иконки и включите уведомления здесь."
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
