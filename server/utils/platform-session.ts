import { createError, deleteCookie, getCookie, getMethod, setCookie, setResponseStatus, type H3Event } from 'h3'
import { z } from 'zod'

import { getApiErrorCode, getApiErrorStatus, PLATFORM_OWNER_ROLE } from '~~/shared/auth/tenancy'

import { backendRequest, readIncomingBody } from './backend'
import { decodeSignedCookieValue, encodeSignedCookieValue } from './admin-session'
import { shouldUseSecureCookie } from './cookie-security'

// Platform-owner session (MULTI_TENANCY D4). Kept apart from the tenant
// (company) cookies: the platform token is never sent to tenant routes and a
// tenant token is never sent to /api/platform/*. The backend token stays in
// an HttpOnly cookie and is never returned to browser code.
const PLATFORM_TOKEN_COOKIE = 'brado_platform_token'
const PLATFORM_SESSION_COOKIE = 'brado_platform_session'
const PLATFORM_SESSION_MAX_AGE = 60 * 60 * 12

const platformSessionSchema = z.object({
  id: z.string().trim().min(1),
  login: z.string().trim().min(1),
  role: z.literal(PLATFORM_OWNER_ROLE)
})

export type PlatformSession = z.infer<typeof platformSessionSchema>

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function cookieOptions(event: H3Event) {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: shouldUseSecureCookie(event)
  }
}

export function getPlatformToken(event: H3Event) {
  return getCookie(event, PLATFORM_TOKEN_COOKIE) || null
}

export function getPlatformSession(event: H3Event): PlatformSession | null {
  if (!getPlatformToken(event)) return null
  const parsed = platformSessionSchema.safeParse(decodeSignedCookieValue(event, getCookie(event, PLATFORM_SESSION_COOKIE)))
  return parsed.success ? parsed.data : null
}

export function setPlatformSession(event: H3Event, token: string, session: PlatformSession) {
  // Sign the session first: a missing secret must not leave a bare token cookie.
  const signed = encodeSignedCookieValue(event, session)
  setCookie(event, PLATFORM_SESSION_COOKIE, signed, { ...cookieOptions(event), maxAge: PLATFORM_SESSION_MAX_AGE })
  setCookie(event, PLATFORM_TOKEN_COOKIE, token, { ...cookieOptions(event), maxAge: PLATFORM_SESSION_MAX_AGE })
}

export function clearPlatformSession(event: H3Event) {
  deleteCookie(event, PLATFORM_SESSION_COOKIE, cookieOptions(event))
  deleteCookie(event, PLATFORM_TOKEN_COOKIE, cookieOptions(event))
}

export function requirePlatformCompanyId(event: H3Event) {
  const id = String(event.context.params?.id || '').trim()

  if (!UUID_PATTERN.test(id)) {
    throw createError({ statusCode: 404, message: 'Компания не найдена.' })
  }

  return id
}

/** Picks only the listed keys that are present in the body. */
export function pickFields(body: unknown, keys: readonly string[]) {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {}
  return Object.fromEntries(keys.filter(key => Object.hasOwn(source, key)).map(key => [key, source[key]]))
}

/**
 * Proxies a platform-owner request with the platform token only. A rejected
 * token (401) or a non-owner account (403 PLATFORM_OWNER_REQUIRED) ends the
 * platform session.
 */
export async function proxyPlatformBackend<T>(
  event: H3Event,
  path: string,
  options: { body?: Record<string, unknown>, method?: string } = {}
): Promise<T> {
  const token = getPlatformToken(event)

  if (!token) {
    throw createError({ statusCode: 401, message: 'Требуется вход владельца платформы.' })
  }

  const method = options.method || getMethod(event)

  try {
    const response = await backendRequest<T>(event, {
      auth: 'none',
      body: options.body ?? (method === 'GET' ? undefined : await readIncomingBody(event) as Record<string, unknown>),
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      method,
      path,
      session: 'platform'
    })

    setResponseStatus(event, response.status)
    return response.data
  }
  catch (error) {
    const status = getApiErrorStatus(error)

    if (status === 401 || (status === 403 && getApiErrorCode(error) === 'PLATFORM_OWNER_REQUIRED')) {
      clearPlatformSession(event)
    }

    throw error
  }
}
