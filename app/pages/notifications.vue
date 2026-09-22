<script setup lang="ts">
const { items, unreadCount, refresh, markAllRead, checkToday, open, openDetails, enablePush, sendTestPush, pushPermission, pushSupported } = useNotifications()
const checking = ref(false)
const checkMessage = ref('')
const enablingPush = ref(false)
const sendingTestPush = ref(false)
const activeFilter = ref<'all' | 'unread'>('all')
const search = ref('')
const router = useRouter()

const filteredItems = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('ru')
  return items.value.filter((item) => {
    if (activeFilter.value === 'unread' && item.read_at) return false
    return !query || `${item.title} ${displayNotificationBody(item.body)}`.toLocaleLowerCase('ru').includes(query)
  })
})

onMounted(() => {
  void refresh()
})

function displayNotificationBody(body: string) {
  return body.replace(/\s*•\s*заказ\s*#\S+/i, '')
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tashkent'
  }).format(new Date(value))
}

async function enablePhoneNotifications() {
  enablingPush.value = true
  try {
    await enablePush()
  } finally {
    enablingPush.value = false
  }
}

async function sendTestNotification() {
  sendingTestPush.value = true
  try {
    await sendTestPush()
  } finally {
    sendingTestPush.value = false
  }
}

async function runTodayCheck() {
  checking.value = true
  checkMessage.value = ''
  try {
    const result = await checkToday()
    checkMessage.value = `Проверено заказов: ${result.checked_count || 0}. Подозрительных найдено: ${result.suspicious_count || 0}.`
  } catch {
    checkMessage.value = 'Не удалось проверить заказы. Проверьте подключение к API.'
  } finally {
    checking.value = false
  }
}

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }

  void router.push('/')
}
</script>

<template>
  <UDashboardPanel
    id="notifications"
    :ui="{
      root: 'h-svh min-h-0 overflow-hidden',
      body: 'min-h-0 flex-1 overflow-y-auto overscroll-contain'
    }"
  >
    <template #header>
      <UDashboardNavbar title="Уведомления" :ui="{ right: 'gap-2' }">
        <template #leading>
          <div class="flex items-center gap-1">
            <UDashboardSidebarCollapse />
            <UButton
              aria-label="Назад"
              color="neutral"
              icon="i-lucide-arrow-left"
              size="sm"
              variant="ghost"
              @click="goBack"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto w-full max-w-6xl space-y-6">
        <section class="flex flex-col gap-5 rounded-3xl border border-charcoal-200 bg-gradient-to-br from-white via-white to-primary/5 p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-4">
            <span class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UIcon name="i-lucide-bell-ring" class="size-6" />
            </span>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl font-semibold tracking-tight text-charcoal-950">Уведомления</h1>
                <UBadge color="error" variant="soft">{{ unreadCount }} непрочитанных</UBadge>
              </div>
              <p class="mt-1 max-w-xl text-sm leading-6 text-charcoal-500">Важные события и подозрительные заказы в одном месте.</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 lg:justify-end">
            <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" @click="refresh()">Обновить</UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-check-check" :disabled="!unreadCount" @click="markAllRead">Прочитать все</UButton>
            <UButton color="primary" icon="i-lucide-search-check" :loading="checking" @click="runTodayCheck">Проверить заказы</UButton>
          </div>
        </section>

        <p v-if="checkMessage" class="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-charcoal-700" role="status">
          {{ checkMessage }}
        </p>

        <section class="grid gap-3 sm:grid-cols-2" aria-label="Настройки push-уведомлений">
          <div class="flex flex-col justify-between gap-4 rounded-2xl border border-charcoal-200 bg-white p-4 sm:flex-row sm:items-center">
            <div class="flex items-start gap-3">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-charcoal-50 text-charcoal-600"><UIcon name="i-lucide-smartphone" class="size-5" /></span>
              <div>
                <p class="font-medium text-charcoal-950">Уведомления на телефон</p>
                <p class="mt-1 text-xs leading-5 text-charcoal-500">Получайте важные события, даже когда панель закрыта.</p>
              </div>
            </div>
            <UButton v-if="pushSupported" class="shrink-0" color="primary" variant="outline" size="sm" :loading="enablingPush" @click="enablePhoneNotifications">
              {{ pushPermission === 'granted' ? 'Настроить' : 'Включить' }}
            </UButton>
            <span v-else class="text-xs text-charcoal-500">Не поддерживается браузером</span>
          </div>

          <div class="flex flex-col justify-between gap-4 rounded-2xl border border-charcoal-200 bg-white p-4 sm:flex-row sm:items-center">
            <div class="flex items-start gap-3">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-charcoal-50 text-charcoal-600"><UIcon name="i-lucide-send" class="size-5" /></span>
              <div>
                <p class="font-medium text-charcoal-950">Проверка доставки</p>
                <p class="mt-1 text-xs leading-5 text-charcoal-500">Отправьте тест, чтобы убедиться, что push работает.</p>
              </div>
            </div>
            <UButton class="shrink-0" color="neutral" variant="outline" size="sm" :loading="sendingTestPush" @click="sendTestNotification">Тестовое уведомление</UButton>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-charcoal-200 bg-white shadow-sm" aria-label="Список уведомлений">
          <div class="flex flex-col gap-3 border-b border-charcoal-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div class="flex items-center gap-1 rounded-xl bg-charcoal-50 p-1">
              <button type="button" class="rounded-lg px-3 py-2 text-sm font-medium transition" :class="activeFilter === 'all' ? 'bg-white text-charcoal-950 shadow-sm' : 'text-charcoal-500 hover:text-charcoal-800'" @click="activeFilter = 'all'">Все <span class="ml-1 text-xs text-charcoal-400">{{ items.length }}</span></button>
              <button type="button" class="rounded-lg px-3 py-2 text-sm font-medium transition" :class="activeFilter === 'unread' ? 'bg-white text-charcoal-950 shadow-sm' : 'text-charcoal-500 hover:text-charcoal-800'" @click="activeFilter = 'unread'">Непрочитанные <span class="ml-1 text-xs text-charcoal-400">{{ unreadCount }}</span></button>
            </div>
            <UInput v-model="search" icon="i-lucide-search" placeholder="Найти уведомление" class="w-full sm:max-w-xs" aria-label="Поиск по уведомлениям" />
          </div>

          <div v-if="filteredItems.length" class="divide-y divide-charcoal-100">
            <article
              v-for="item in filteredItems"
              :key="item.id"
              class="group flex cursor-pointer items-start gap-3 px-4 py-4 transition hover:bg-charcoal-50/80 sm:gap-4 sm:px-5"
              :class="item.read_at ? 'opacity-70' : ''"
              role="button"
              tabindex="0"
              @click="open(item)"
              @keydown.enter="open(item)"
              @keydown.space.prevent="open(item)"
            >
              <span class="relative mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl" :class="item.read_at ? 'bg-charcoal-100 text-charcoal-500' : 'bg-red-50 text-red-700'">
                <UIcon name="i-lucide-triangle-alert" class="size-5" />
                <span v-if="!item.read_at" class="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-red-500" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <h2 class="text-sm font-semibold text-charcoal-950">{{ item.title }}</h2>
                  <time class="shrink-0 text-xs text-charcoal-400" :datetime="item.created_at">{{ formatNotificationDate(item.created_at) }}</time>
                </div>
                <p class="mt-1 text-sm leading-6 text-charcoal-600">{{ displayNotificationBody(item.body) }}</p>
                <UButton v-if="item.order_id" class="mt-3" color="primary" variant="outline" size="xs" trailing-icon="i-lucide-arrow-up-right" @click.stop="openDetails(item)">Открыть заказ</UButton>
              </div>
            </article>
          </div>
          <div v-else class="px-5 py-12 text-center">
            <span class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-charcoal-50 text-charcoal-400"><UIcon name="i-lucide-bell-off" class="size-6" /></span>
            <h2 class="mt-4 font-semibold text-charcoal-950">{{ search || activeFilter === 'unread' ? 'Ничего не найдено' : 'Уведомлений пока нет' }}</h2>
            <p class="mt-1 text-sm text-charcoal-500">{{ search ? 'Попробуйте изменить поисковый запрос.' : activeFilter === 'unread' ? 'Все уведомления уже прочитаны.' : 'Здесь появятся важные события и уведомления о заказах.' }}</p>
            <UButton v-if="search || activeFilter === 'unread'" class="mt-4" color="neutral" variant="outline" size="sm" @click="search = ''; activeFilter = 'all'">Сбросить фильтр</UButton>
          </div>
        </section>
        <p class="pb-2 text-center text-xs text-charcoal-400">Показаны последние {{ items.length }} уведомлений</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
