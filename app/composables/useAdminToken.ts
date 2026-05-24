import { StorageSerializers, useStorage } from '@vueuse/core'

const ADMIN_TOKEN_STORAGE_KEY = 'brado_admin_jwt'
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000

type StoredAdminToken = {
  expiresAt: number
  token: string
}

function normalizeToken(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const token = String(value).trim()
  return token ? token : null
}

function decodeJwtExpiresAt(token: string) {
  const payload = token.split('.')[1]

  if (!payload || typeof globalThis.atob !== 'function') {
    return null
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = `${normalized}${'='.repeat((4 - normalized.length % 4) % 4)}`
    const decoded = JSON.parse(globalThis.atob(padded))
    const exp = Number(decoded?.exp)

    return Number.isFinite(exp) && exp > 0 ? exp * 1000 : null
  }
  catch {
    return null
  }
}

function createStoredToken(token: string): StoredAdminToken {
  const ttlExpiresAt = Date.now() + ADMIN_TOKEN_TTL_MS
  const jwtExpiresAt = decodeJwtExpiresAt(token)

  return {
    expiresAt: jwtExpiresAt ? Math.min(jwtExpiresAt, ttlExpiresAt) : ttlExpiresAt,
    token
  }
}

function serializeStoredToken(value: StoredAdminToken) {
  return JSON.stringify(value)
}

function parseStoredToken(value: string | null): StoredAdminToken | null {
  if (!value) {
    return null
  }

  const raw = normalizeToken(value)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)

    if (parsed && typeof parsed === 'object') {
      const token = normalizeToken((parsed as StoredAdminToken).token)
      const expiresAt = Number((parsed as StoredAdminToken).expiresAt)

      if (!token || !Number.isFinite(expiresAt)) {
        return null
      }

      return { expiresAt, token }
    }
  }
  catch {
    // Legacy storage kept only the raw JWT.
  }

  return createStoredToken(raw)
}

export function useAdminToken() {
  const token = useStorage<string | null>(ADMIN_TOKEN_STORAGE_KEY, null, undefined, {
    listenToStorageChanges: false,
    serializer: StorageSerializers.string
  })

  function getValidStoredToken() {
    const stored = parseStoredToken(token.value)

    if (!stored) {
      token.value = null
      return null
    }

    if (stored.expiresAt <= Date.now()) {
      token.value = null
      return null
    }

    if (token.value !== serializeStoredToken(stored)) {
      token.value = serializeStoredToken(stored)
    }

    return stored
  }

  const authHeader = computed(() => {
    const stored = getValidStoredToken()
    return stored ? `Bearer ${stored.token}` : null
  })

  const expiresAt = computed(() => getValidStoredToken()?.expiresAt ?? null)

  function set(nextToken: string | null) {
    const value = normalizeToken(nextToken)
    token.value = value ? serializeStoredToken(createStoredToken(value)) : null
  }

  function clear() {
    token.value = null
  }

  function clearExpired() {
    const stored = parseStoredToken(token.value)

    if (!stored) {
      token.value = null
      return false
    }

    if (stored.expiresAt > Date.now()) {
      if (token.value !== serializeStoredToken(stored)) {
        token.value = serializeStoredToken(stored)
      }
      return false
    }

    token.value = null
    return true
  }

  return {
    authHeader,
    clear,
    clearExpired,
    expiresAt,
    set,
    token
  }
}
