import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { detectPushDeviceKind, getPushCapability, type PushEnvironment } from '../app/utils/pushCapabilities.ts'

const notificationsPage = readFileSync(new URL('../app/pages/notifications.vue', import.meta.url), 'utf8')
const pushSettingsPage = readFileSync(new URL('../app/pages/settings/notifications.vue', import.meta.url), 'utf8')
const notificationsComposable = readFileSync(new URL('../app/composables/useNotifications.ts', import.meta.url), 'utf8')

const supported: PushEnvironment = {
  secureContext: true,
  serviceWorker: true,
  notifications: true,
  pushManager: true,
  vapidPublicKey: true
}

test('recognizes desktop, phone and tablet through browser and touch capabilities', () => {
  assert.equal(detectPushDeviceKind({ platform: 'Win32', userAgent: 'Windows', maxTouchPoints: 0, coarsePointer: false, screenWidth: 1440, screenHeight: 900 }), 'computer')
  assert.equal(detectPushDeviceKind({ userAgentMobile: true, platform: 'Android', maxTouchPoints: 5 }), 'phone')
  assert.equal(detectPushDeviceKind({ platform: 'iPad', maxTouchPoints: 5, coarsePointer: true }), 'tablet')
  assert.equal(detectPushDeviceKind({ platform: 'Win32', maxTouchPoints: 10, coarsePointer: true, screenWidth: 1024, screenHeight: 768 }), 'tablet')
})

test('requires HTTPS, Service Worker, Notifications, Push API and configured VAPID key before offering push', () => {
  assert.deepEqual(getPushCapability(supported), { supported: true, reason: '' })
  for (const [key, expected] of [
    ['secureContext', 'защищённое HTTPS'],
    ['serviceWorker', 'Service Worker'],
    ['notifications', 'Notifications API'],
    ['pushManager', 'Push API'],
    ['vapidPublicKey', 'публичный ключ']
  ] as const) {
    const capability = getPushCapability({ ...supported, [key]: false })
    assert.equal(capability.supported, false)
    assert.ok(capability.reason.includes(expected))
  }
})

test('browser UI labels the current device and separates permission from backend registration', () => {
  assert.match(notificationsPage, /Вы используете компьютер\. Push-уведомления доступны в этом браузере/)
  assert.match(notificationsPage, /deviceKind\.value === 'computer'/)
  assert.match(notificationsPage, /pushEnabled\.value\) return `Устройство зарегистрировано/)
  assert.match(notificationsPage, /pushServiceAvailable\.value !== true/)
  assert.match(notificationsPage, /pushPermission !== 'denied'/)
  assert.match(pushSettingsPage, /Настройка и тест относятся только к этому браузеру/)
  assert.match(notificationsComposable, /push-subscription\/status/)
  assert.match(notificationsComposable, /status\?\.registered === true/)
  assert.match(notificationsComposable, /status\?\.available === true/)
  assert.ok(notificationsComposable.indexOf("if (Notification.permission === 'denied')") < notificationsComposable.indexOf('Notification.requestPermission()'))
})

test('enable preserves an existing browser subscription and test sends only to its endpoint', () => {
  assert.match(notificationsComposable, /let subscription = await registration\.pushManager\.getSubscription\(\)/)
  assert.match(notificationsComposable, /if \(!subscription\) \{/)
  assert.doesNotMatch(notificationsComposable, /existing\.unsubscribe\(\)/)
  assert.match(notificationsComposable, /body: \{ endpoint: currentPushEndpoint\.value \}/)
  assert.match(notificationsComposable, /if \(pushServiceAvailable\.value !== true \|\| !pushEnabled\.value \|\| !currentPushEndpoint\.value\)/)
})
