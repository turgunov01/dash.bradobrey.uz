import { useStorage } from '@vueuse/core'

const ADMIN_TOKEN_STORAGE_KEY = 'brado_admin_jwt'

function normalizeToken(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const token = String(value).trim()
  return token ? token : null
}

export function useAdminToken() {
  const token = useStorage<string | null>(ADMIN_TOKEN_STORAGE_KEY, null, undefined, {
    listenToStorageChanges: false
  })

  const authHeader = computed(() => {
    const value = normalizeToken(token.value)
    return value ? `Bearer ${value}` : null
  })

  function set(nextToken: string | null) {
    token.value = normalizeToken(nextToken)
  }

  function clear() {
    token.value = null
  }

  return {
    authHeader,
    clear,
    set,
    token
  }
}

