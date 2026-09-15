<script setup lang="ts">
const { items, unreadCount, refresh, markAllRead, checkToday, open, enablePush, pushPermission, pushSupported } = useNotifications()
const checking = ref(false)
const checkMessage = ref('')
const enablingPush = ref(false)
await refresh()

async function enablePhoneNotifications() {
  enablingPush.value = true
  try {
    await enablePush()
  } finally {
    enablingPush.value = false
  }
}

async function runTodayCheck() {
  checking.value = true
  checkMessage.value = ''
  try {
    const result = await checkToday()
    checkMessage.value = `Проверено заказов: ${result.checked_count || 0}. Подозрительных найдено: ${result.suspicious_count || 0}.`
  } catch (error) {
    checkMessage.value = 'Не удалось проверить заказы. Проверьте подключение к API.'
  } finally {
    checking.value = false
  }
}
</script>
<template>
  <UDashboardPanel id="notifications">
    <template #body>
      <div class="mb-5 flex items-center justify-between gap-3">
        <div><h1 class="text-2xl font-semibold text-charcoal-950">Уведомления</h1><p class="text-sm text-charcoal-500">Подозрительные заказы и важные события</p></div>
        <div class="flex flex-wrap justify-end gap-2"><UBadge color="error" variant="soft">{{ unreadCount }} новых</UBadge><UButton v-if="pushSupported && pushPermission !== 'granted'" color="primary" variant="outline" icon="i-lucide-smartphone" :loading="enablingPush" @click="enablePhoneNotifications">Включить уведомления на телефон</UButton><UButton color="primary" icon="i-lucide-search-check" :loading="checking" @click="runTodayCheck">Проверить заказы сегодня</UButton><UButton color="neutral" variant="outline" icon="i-lucide-check-check" :disabled="!unreadCount" @click="markAllRead">Прочитать все</UButton><UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" @click="refresh()">Обновить</UButton></div>
      </div>
      <p v-if="checkMessage" class="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-charcoal-700">{{ checkMessage }}</p>
      <div v-if="items.length" class="divide-y divide-charcoal-100 overflow-hidden rounded-2xl border border-charcoal-200 bg-white/90">
        <button v-for="item in items" :key="item.id" type="button" class="flex w-full items-start gap-3 p-4 text-left transition hover:bg-charcoal-50" :class="item.read_at ? 'opacity-70' : ''" @click="open(item)">
          <span class="mt-1 rounded-full p-2" :class="item.read_at ? 'bg-charcoal-100 text-charcoal-500' : 'bg-red-100 text-red-700'"><UIcon name="i-lucide-triangle-alert" class="size-5" /></span>
          <span class="min-w-0 flex-1"><span class="flex items-center justify-between gap-3"><strong class="text-sm text-charcoal-950">{{ item.title }}</strong><time class="text-xs text-charcoal-500">{{ new Date(item.created_at).toLocaleString('ru-RU') }}</time></span><span class="mt-1 block text-sm text-charcoal-600">{{ item.body }}</span><span class="mt-2 block text-xs font-medium text-primary">Нажмите, чтобы открыть заказ в истории →</span></span>
        </button>
      </div>
      <SharedEmptyState v-else icon="i-lucide-bell-off" title="Уведомлений пока нет" description="Здесь появятся уведомления о подозрительных заказах." />
    </template>
  </UDashboardPanel>
</template>
