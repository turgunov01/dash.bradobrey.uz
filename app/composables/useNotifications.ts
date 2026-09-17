type NotificationItem = { id: string, title: string, body: string, order_id?: string | null, read_at?: string | null, created_at: string, data?: Record<string, any> }

function getNotificationBody(item: NotificationItem) {
  // Keep old notifications readable after removing the ID from new messages.
  return item.body.replace(/\s*•\s*заказ\s*#\S+/i, '')
}

function decodeVapidKey(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, character => character.charCodeAt(0))
}

export function useNotifications() {
  const items = useState<NotificationItem[]>('notifications-items', () => [])
  const unreadCount = useState<number>('notifications-unread-count', () => 0)
  const started = useState<boolean>('notifications-started', () => false)
  const api = useApiClient()
  const router = useRouter()
  const toast = useToast()
  const config = useRuntimeConfig()
  const pushPermission = ref<NotificationPermission | 'unsupported'>('default')
  const pushEnabled = ref(false)
  const pushSupported = computed(() => import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)
  async function refreshPushState() {
    if (!pushSupported.value) {
      pushEnabled.value = false
      return false
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager.getSubscription()
      pushEnabled.value = Boolean(subscription)
    }
    catch {
      pushEnabled.value = false
    }
    return pushEnabled.value
  }
  async function refresh(options: { notify?: boolean } = {}) {
    try {
      const response = await api.request<{ items?: NotificationItem[], unread_count?: number }>('/api/notifications', { query: { limit: 50 }, silent: true })
      const next = response?.items || []
      if (options.notify && started.value) {
        const previous = new Set(items.value.map(item => item.id))
        next.filter(item => !previous.has(item.id) && !item.read_at).reverse().forEach(item => toast.add({ color: 'error', title: item.title, description: getNotificationBody(item), actions: item.order_id ? [{ label: 'Открыть заказ', onClick: () => openDetails(item) }] : undefined }))
      }
      items.value = next
      unreadCount.value = Number(response?.unread_count || 0)
      started.value = true
    } catch { /* auth/layout may be loading */ }
  }
  async function markRead(item: NotificationItem) {
    if (!item.read_at) { await api.request(`/api/notifications/${item.id}/read`, { method: 'PATCH', silent: true }); item.read_at = new Date().toISOString(); unreadCount.value = Math.max(0, unreadCount.value - 1) }
  }
  async function markAllRead() { await api.request('/api/notifications/read-all', { method: 'PATCH', silent: true }); items.value.forEach(item => { item.read_at ||= new Date().toISOString() }); unreadCount.value = 0 }
  async function checkToday() {
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const result = await api.request<{ checked_count?: number, suspicious_count?: number }>('/api/notifications/check-today', { method: 'POST', body: { date }, silent: true })
    await refresh()
    return result
  }
  function open(item: NotificationItem) {
    markRead(item)
  }
  function openDetails(item: NotificationItem) {
    markRead(item)
    if (item.order_id) {
      // The order may belong to another branch than the currently selected one.
      // Load the global history so the details modal can find it.
      router.push({ path: '/history', query: { scope: 'all', order_id: item.order_id } })
    }
  }
  async function enablePush() {
    if (!pushSupported.value) {
      pushPermission.value = 'unsupported'
      return false
    }

    pushPermission.value = await Notification.requestPermission()
    if (pushPermission.value !== 'granted') return false

    const publicKey = String(config.public.vapidPublicKey || '').trim()
    if (!publicKey) {
      toast.add({ color: 'warning', title: 'Push не настроен', description: 'На сервере не задан публичный VAPID-ключ.' })
      return false
    }

    // `register()` may resolve while the worker is still installing. Push
    // subscriptions can only be created by an active worker, so wait for the
    // browser's ready registration before accessing PushManager.
    await navigator.serviceWorker.register('/sw.js')
    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    if (existing) await existing.unsubscribe()
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(publicKey)
    })
    await api.request('/api/notifications/push-subscription', {
      method: 'POST',
      body: subscription.toJSON(),
      silent: false
    })
    pushEnabled.value = true
    toast.add({ color: 'success', title: 'Уведомления включены', description: 'Подозрительные заказы будут приходить на это устройство.' })
    return true
  }
  async function disablePush() {
    if (!pushSupported.value) return false
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        await api.request('/api/notifications/push-subscription', {
          method: 'DELETE',
          body: { endpoint: subscription.endpoint },
          silent: false
        })
        await subscription.unsubscribe()
      }
      pushEnabled.value = false
      toast.add({ color: 'success', title: 'Уведомления выключены', description: 'Этот телефон больше не будет получать push-уведомления.' })
      return true
    }
    catch (error) {
      api.notifyError(error)
      return false
    }
  }
  async function sendTestPush() {
    const requestTest = () => api.request<{ found?: number, sent?: number, failed?: number, removed?: number }>('/api/notifications/test-push', {
      method: 'POST',
      // A 410 is an expected recovery signal: the API removes the expired
      // subscription, then we register the current browser and retry below.
      // Do not show a transient error toast for that first attempt.
      silent: true
    })
    let result
    try {
      result = await requestTest()
    } catch (error: any) {
      const status = Number(error?.statusCode || error?.status || error?.response?.status || 0)
      if (status !== 410) {
        api.notifyError(error)
        return
      }

      // The API removed an expired endpoint (for example after VAPID rotation).
      // Re-register this browser once, then retry the test delivery.
      const reRegistered = await enablePush()
      if (!reRegistered) {
        toast.add({ color: 'warning', title: 'Нужно включить уведомления', description: 'Нажмите «Включить уведомления на телефон», затем повторите тест.' })
        return
      }
      try {
        result = await requestTest()
      } catch (retryError) {
        api.notifyError(retryError)
        return
      }
    }
    toast.add({ color: 'success', title: 'Тест отправлен', description: `Устройств найдено: ${result?.found || 0}. Доставлено: ${result?.sent || 0}.` })
  }
  if (import.meta.client && pushSupported.value) pushPermission.value = Notification.permission
  if (import.meta.client && pushSupported.value) refreshPushState()
  return { items, unreadCount, refresh, markRead, markAllRead, checkToday, open, openDetails, enablePush, disablePush, refreshPushState, sendTestPush, pushPermission, pushEnabled, pushSupported }
}
