const ADMIN_TOKEN_STORAGE_KEY = 'brado_admin_jwt'
const ADMIN_TOKEN_STATE_KEY = 'brado_admin_jwt_state'
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

function readClientToken() {
  if (!import.meta.client) {
    return null
  }

  try {
    return globalThis.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
  }
  catch {
    return null
  }
}

function writeClientToken(value: string | null) {
  if (!import.meta.client) {
    return
  }

  try {
    if (value === null) {
      globalThis.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
    }
    else {
      globalThis.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, value)
    }
  }
  catch {
    // The HttpOnly session cookie remains the primary authentication channel.
  }
}

export function useAdminToken() {
  // useState is shared by every composable consumer in the current Nuxt app.
  // Separate useStorage refs can be stale during the immediate /me request after login.
  const token = useState<string | null>(ADMIN_TOKEN_STATE_KEY, () => null)

  if (import.meta.client && token.value === null) {
    token.value = readClientToken()
  }

  function updateToken(value: string | null) {
    token.value = value
    writeClientToken(value)
  }

  function getValidStoredToken() {
    const stored = parseStoredToken(token.value)

    if (!stored) {
      updateToken(null)
      return null
    }

    if (stored.expiresAt <= Date.now()) {
      updateToken(null)
      return null
    }

    if (token.value !== serializeStoredToken(stored)) {
      updateToken(serializeStoredToken(stored))
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
    updateToken(value ? serializeStoredToken(createStoredToken(value)) : null)
  }

  function clear() {
    updateToken(null)
  }

  function clearExpired() {
    const stored = parseStoredToken(token.value)

    if (!stored) {
      updateToken(null)
      return false
    }

    if (stored.expiresAt > Date.now()) {
      if (token.value !== serializeStoredToken(stored)) {
        updateToken(serializeStoredToken(stored))
      }
      return false
    }

    updateToken(null)
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
