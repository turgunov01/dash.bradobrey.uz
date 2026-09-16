type NotificationItem = { id: string, title: string, body: string, order_id?: string | null, read_at?: string | null, created_at: string, data?: Record<string, any> }

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
  const pushSupported = computed(() => import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)
  async function refresh(options: { notify?: boolean } = {}) {
    try {
      const response = await api.request<{ items?: NotificationItem[], unread_count?: number }>('/api/notifications', { query: { limit: 50 }, silent: true })
      const next = response?.items || []
      if (options.notify && started.value) {
        const previous = new Set(items.value.map(item => item.id))
        next.filter(item => !previous.has(item.id) && !item.read_at).reverse().forEach(item => toast.add({ color: 'error', title: item.title, description: item.body, actions: item.order_id ? [{ label: 'Открыть заказ', onClick: () => open(item) }] : undefined }))
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
    toast.add({ color: 'success', title: 'Уведомления включены', description: 'Подозрительные заказы будут приходить на это устройство.' })
    return true
  }
  async function sendTestPush() {
    const result = await api.request<{ found?: number, sent?: number, failed?: number, removed?: number }>('/api/notifications/test-push', {
      method: 'POST',
      silent: false
    })
    toast.add({ color: 'success', title: 'Тест отправлен', description: `Устройств найдено: ${result?.found || 0}. Доставлено: ${result?.sent || 0}.` })
  }
  if (import.meta.client && pushSupported.value) pushPermission.value = Notification.permission
  return { items, unreadCount, refresh, markRead, markAllRead, checkToday, open, enablePush, sendTestPush, pushPermission, pushSupported }
}
