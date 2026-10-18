export type PushDeviceKind = 'phone' | 'tablet' | 'computer'

export type PushEnvironment = {
  secureContext: boolean
  serviceWorker: boolean
  notifications: boolean
  pushManager: boolean
  vapidPublicKey: boolean
  userAgentMobile?: boolean
  platform?: string
  userAgent?: string
  maxTouchPoints?: number
  screenWidth?: number
  screenHeight?: number
  coarsePointer?: boolean
}

export function detectPushDeviceKind(environment: Pick<PushEnvironment, 'userAgentMobile' | 'platform' | 'userAgent' | 'maxTouchPoints' | 'screenWidth' | 'screenHeight' | 'coarsePointer'>): PushDeviceKind {
  const platform = String(environment.platform || '')
  const userAgent = String(environment.userAgent || '')
  const touchPoints = Number(environment.maxTouchPoints || 0)
  const mobileHint = environment.userAgentMobile === true || /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(userAgent)
  if (mobileHint) return 'phone'

  const tabletHint = /iPad|Android|Tablet/i.test(`${platform} ${userAgent}`)
    || (/MacIntel/i.test(platform) && touchPoints > 1)
  if (tabletHint) return 'tablet'

  // Touch plus a coarse primary pointer distinguishes touch tablets from a
  // desktop display that happens to have a narrow window or small viewport.
  if (environment.coarsePointer && touchPoints > 0) {
    const shortestSide = Math.min(Number(environment.screenWidth || 0), Number(environment.screenHeight || 0))
    if (shortestSide > 0 && shortestSide <= 600) return 'phone'
    if (shortestSide > 600 && shortestSide <= 1200) return 'tablet'
  }
  return 'computer'
}

export function getPushCapability(environment: PushEnvironment) {
  if (!environment.secureContext) return { supported: false, reason: 'Для push-уведомлений требуется защищённое HTTPS-соединение.' }
  if (!environment.serviceWorker) return { supported: false, reason: 'Этот браузер не поддерживает Service Worker.' }
  if (!environment.notifications) return { supported: false, reason: 'Этот браузер не поддерживает Notifications API.' }
  if (!environment.pushManager) return { supported: false, reason: 'Этот браузер не поддерживает Push API.' }
  if (!environment.vapidPublicKey) return { supported: false, reason: 'Push-сервис не настроен: отсутствует публичный ключ.' }
  return { supported: true, reason: '' }
}
