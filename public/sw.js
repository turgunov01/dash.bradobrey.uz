self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data?.text() || '' }
  }

  const title = payload.title || 'Новое уведомление'
  const options = {
    body: payload.body || 'Проверьте уведомления в админке.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.url || '/notifications',
    tag: payload.tag || 'bradobrey-notification'
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data || '/notifications', self.location.origin).href
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find(window => window.url.startsWith(self.location.origin))
    if (existing) return existing.focus().then(() => existing.navigate(target))
    return clients.openWindow(target)
  }))
})
