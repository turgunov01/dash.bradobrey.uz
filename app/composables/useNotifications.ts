import { detectPushDeviceKind, getPushCapability, type PushDeviceKind } from '~/utils/pushCapabilities'

type NotificationItem = { id: string, type?: string, title: string, body: string, order_id?: string | null, branch_id?: string | null, read_at?: string | null, created_at: string, data?: Record<string, any> }

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
  const pushSupported = ref(false)
  const pushServiceAvailable = ref<boolean | null>(null)
  const pushSupportReason = ref('')
  const pushStatusMessage = ref('')
  const pushChecking = ref(false)
  const deviceKind = ref<PushDeviceKind>('computer')
  const currentPushEndpoint = ref('')
  const deviceResolved = ref(false)
  const deviceLabel = computed(() => deviceKind.value === 'phone' ? 'телефоне' : deviceKind.value === 'tablet' ? 'планшете' : 'компьютере')

  function getBrowserPushEnvironment() {
    const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean, platform?: string } }).userAgentData
    const environment = {
      secureContext: window.isSecureContext === true,
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
      pushManager: 'PushManager' in window,
      vapidPublicKey: Boolean(String(config.public.vapidPublicKey || '').trim()),
      userAgentMobile: uaData?.mobile,
      platform: uaData?.platform || navigator.platform,
      userAgent: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      screenWidth: window.screen?.width || 0,
      screenHeight: window.screen?.height || 0,
      coarsePointer: window.matchMedia?.('(pointer: coarse)').matches || false
    }
    deviceKind.value = detectPushDeviceKind(environment)
    deviceResolved.value = true
    return environment
  }

  async function refreshPushState() {
    if (!import.meta.client) return false
    pushChecking.value = true
    pushStatusMessage.value = ''
    try {
      const capability = getPushCapability(getBrowserPushEnvironment())
      pushSupported.value = capability.supported
      pushSupportReason.value = capability.reason
      pushPermission.value = 'Notification' in window ? Notification.permission : 'unsupported'
      if (!capability.supported) {
        pushServiceAvailable.value = false
        currentPushEndpoint.value = ''
        pushEnabled.value = false
        return false
      }

      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager.getSubscription()
      currentPushEndpoint.value = subscription?.endpoint || ''
      const status = await api.request<{ available?: boolean, registered?: boolean }>('/api/notifications/push-subscription/status', {
        method: 'POST',
        body: currentPushEndpoint.value ? { endpoint: currentPushEndpoint.value } : {},
        silent: true
      })
      pushServiceAvailable.value = status?.available === true
      pushEnabled.value = status?.registered === true && pushPermission.value === 'granted'
      if (!pushServiceAvailable.value) pushStatusMessage.value = 'Push-сервис на сервере не настроен или временно недоступен.'
      else if (pushPermission.value === 'granted' && !currentPushEndpoint.value) pushStatusMessage.value = 'Разрешение выдано, но подписка браузера отсутствует.'
      else if (pushPermission.value === 'granted' && !pushEnabled.value) pushStatusMessage.value = 'Разрешение выдано, но это устройство ещё не зарегистрировано на сервере.'
    }
    catch {
      pushServiceAvailable.value = false
      pushEnabled.value = false
      pushStatusMessage.value = 'Не удалось проверить push-сервис и регистрацию устройства. Проверьте соединение и войдите в dashboard повторно.'
    }
    finally {
      pushChecking.value = false
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
    if (!import.meta.client) return false
    const capability = getPushCapability(getBrowserPushEnvironment())
    pushSupported.value = capability.supported
    pushSupportReason.value = capability.reason
    if (!capability.supported) {
      toast.add({ color: 'warning', title: 'Push недоступен', description: capability.reason })
      return false
    }
    if (pushServiceAvailable.value !== true) {
      toast.add({ color: 'warning', title: 'Push-сервис недоступен', description: pushStatusMessage.value || 'Сервер push-уведомлений не подтвердил готовность.' })
      return false
    }
    if (Notification.permission === 'denied') {
      pushPermission.value = 'denied'
      toast.add({ color: 'warning', title: 'Разрешение запрещено', description: 'Разрешите уведомления в настройках этого браузера, затем повторите подключение.' })
      return false
    }

    try {
      pushPermission.value = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
      if (pushPermission.value !== 'granted') {
        toast.add({ color: 'warning', title: 'Уведомления не разрешены', description: 'Разрешите уведомления для dashboard в запросе браузера.' })
        return false
      }

      const publicKey = String(config.public.vapidPublicKey || '').trim()
      await navigator.serviceWorker.register('/sw.js')
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(publicKey)
        })
      }
      currentPushEndpoint.value = subscription.endpoint
      const registrationResult = await api.request<{ success?: boolean }>('/api/notifications/push-subscription', {
        method: 'POST',
        body: subscription.toJSON(),
        silent: true
      })
      if (registrationResult?.success !== true) throw new Error('Сервер не подтвердил регистрацию устройства')
      const registered = await refreshPushState()
      if (!registered) throw new Error('Сервер не подтвердил активную регистрацию этого устройства')
      toast.add({ color: 'success', title: 'Уведомления включены', description: `Push-уведомления подключены в этом браузере на ${deviceLabel.value}.` })
      return true
    }
    catch (error) {
      pushEnabled.value = false
      pushStatusMessage.value = 'Не удалось зарегистрировать это устройство на сервере.'
      api.notifyError(error)
      return false
    }
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
        if (currentPushEndpoint.value === subscription.endpoint) currentPushEndpoint.value = ''
      }
      pushEnabled.value = false
      toast.add({ color: 'success', title: 'Уведомления выключены', description: `Push-уведомления отключены на этом ${deviceLabel.value}.` })
      return true
    }
    catch (error) {
      api.notifyError(error)
      return false
    }
  }
  async function sendTestPush() {
    if (pushServiceAvailable.value !== true || !pushEnabled.value || !currentPushEndpoint.value) {
      toast.add({ color: 'warning', title: 'Устройство не зарегистрировано', description: 'Сначала включите push-уведомления на этом устройстве и дождитесь подтверждения регистрации.' })
      return false
    }
    const requestTest = () => api.request<{ found?: number, sent?: number, failed?: number, removed?: number }>('/api/notifications/test-push', {
      method: 'POST',
      body: { endpoint: currentPushEndpoint.value },
      silent: true
    })
    try {
      const result = await requestTest()
      if (!result?.sent) throw new Error('Тест не доставлен на это устройство')
      toast.add({ color: 'success', title: 'Тест отправлен', description: `Уведомление отправлено на этот браузер (${result.sent}).` })
      return true
    } catch (error: any) {
      const status = Number(error?.statusCode || error?.status || error?.response?.status || 0)
      if (status === 404 || status === 410) {
        pushEnabled.value = false
        pushStatusMessage.value = 'Подписка этого устройства отсутствует или устарела. Подключите уведомления заново.'
        toast.add({ color: 'warning', title: 'Нужно подключить устройство', description: 'Нажмите «Включить на этом устройстве», затем повторите тест.' })
      } else {
        api.notifyError(error)
      }
      await refreshPushState()
      return false
    }
  }
  if (import.meta.client) void refreshPushState()
  return { items, unreadCount, refresh, markRead, markAllRead, checkToday, open, openDetails, enablePush, disablePush, refreshPushState, sendTestPush, pushPermission, pushEnabled, pushSupported, pushServiceAvailable, pushSupportReason, pushStatusMessage, pushChecking, deviceKind, deviceLabel, deviceResolved }
}
