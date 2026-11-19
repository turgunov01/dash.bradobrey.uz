import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type PlatformOwnerUser = {
  id: string
  login: string
  role: 'platform_owner'
}

type PlatformStatus = 'idle' | 'loading' | 'loaded'

// Platform-owner session (separate from the company session store). The BFF
// keeps the backend token in an HttpOnly cookie; the browser only sees the user.
export const usePlatformSessionStore = defineStore('platformSession', () => {
  const requestFetch = useRequestFetch()
  const user = ref<PlatformOwnerUser | null>(null)
  const status = ref<PlatformStatus>('idle')

  const isAuthenticated = computed(() => Boolean(user.value))

  async function ensureLoaded(options: { force?: boolean } = {}) {
    if (status.value === 'loaded' && !options.force) return user.value

    status.value = 'loading'

    try {
      const response = await requestFetch<{ user: PlatformOwnerUser }>('/api/platform/session')
      user.value = response?.user ?? null
    }
    catch {
      user.value = null
    }
    finally {
      status.value = 'loaded'
    }

    return user.value
  }

  async function login(payload: { login: string, password: string }) {
    const response = await $fetch<{ user: PlatformOwnerUser }>('/api/platform/login', {
      body: payload,
      credentials: 'include',
      method: 'POST'
    })

    user.value = response.user
    status.value = 'loaded'

    // A company session in the same browser was dropped by the BFF; forget its token too.
    useAdminToken().clear()
    useSessionStore().setSession({ barber: null, user: null })

    return response.user
  }

  async function logout() {
    try {
      await $fetch('/api/platform/logout', { credentials: 'include', method: 'POST' })
    }
    finally {
      endSession()
    }
  }

  function endSession() {
    user.value = null
    status.value = 'loaded'
  }

  return { endSession, ensureLoaded, isAuthenticated, login, logout, status, user }
})
