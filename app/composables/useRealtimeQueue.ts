import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

const REFRESH_KEYS = [
  'overview-dashboard',
  'barber-workspace',
  'barber-queue-detail',
  'kiosk-dashboard',
  'history-global',
  'statistics-dashboard'
]

export function useRealtimeQueue() {
  const nuxtApp = useNuxtApp()
  const branchStore = useBranchStore()
  const sessionStore = useSessionStore()
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
      transports: ['websocket', 'polling']
    })

    socketRef.value = socket

    socket.on('connect', () => {
      isConnected.value = true
      joinBranchRoom()
    })

    socket.on('disconnect', () => {
      isConnected.value = false
    })

    socket.on('queue:update', () => {
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
