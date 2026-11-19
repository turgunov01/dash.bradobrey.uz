import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

import { isSessionEndCode } from '~~/shared/auth/tenancy'

const REFRESH_KEYS = [
  'overview-dashboard',
  'barber-workspace',
  'barber-pending-transfers',
  'barber-queue-detail',
  'kiosk-dashboard',
  'history-global',
  'statistics-dashboard'
]

export function useRealtimeQueue() {
  const nuxtApp = useNuxtApp()
  const branchStore = useBranchStore()
  const sessionStore = useSessionStore()
  const adminToken = useAdminToken()
  const runtimeConfig = useRuntimeConfig()

  const isConnected = useState('realtime-connected', () => false)
  const socketRef = useState<Socket | null>('realtime-socket', () => null)

  function refreshRelevantData() {
    nuxtApp.runWithContext(() => {
      REFRESH_KEYS.forEach(key => refreshNuxtData(key))
    })
  }

  function joinBranchRoom() {
    const branchId = branchStore.activeBranchId || sessionStore.barber?.branch_id

    if (!branchId || !socketRef.value) {
      return
    }

    socketRef.value.emit('join_branch', String(branchId))
  }

  onMounted(() => {
    if (socketRef.value) {
      joinBranchRoom()
      return
    }

    const socket = io(runtimeConfig.public.apiBase, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: () => {
        const header = adminToken.authHeader.value
        return header ? { token: header.slice(7) } : {}
      }
    })

    socketRef.value = socket

    socket.on('connect', () => {
      isConnected.value = true
      joinBranchRoom()
      // Socket.IO does not replay events missed while the browser was offline.
      // Re-read durable queue/transfer state after every reconnect.
      refreshRelevantData()
    })

    socket.on('disconnect', () => {
      isConnected.value = false
    })

    // The API rejects a socket whose token role or company is no longer valid
    // (data.code = TOKEN_ROLE_STALE etc.): stop reconnecting and log out.
    socket.on('connect_error', (error: Error & { data?: { code?: string } }) => {
      const reason = error?.data?.code
      if (!isSessionEndCode(reason)) return

      socket.disconnect()
      socketRef.value = null
      void nuxtApp.runWithContext(async () => {
        // The socket talks to the API directly, so the BFF cookies are still set.
        await sessionStore.logout(undefined, { silent: true }).catch(() => undefined)
        sessionStore.endSession(reason)
        await navigateTo({ path: '/login', query: { reason } })
      })
    })

    socket.on('queue:update', () => {
      refreshRelevantData()
    })

    socket.on('barber_changed', () => {
      refreshRelevantData()
    })

    socket.on('queue.barber_changed', () => {
      refreshRelevantData()
    })
  })

  watch(
    () => branchStore.activeBranchId || sessionStore.barber?.branch_id,
    () => {
      joinBranchRoom()
    }
  )

  return {
    isConnected
  }
}
