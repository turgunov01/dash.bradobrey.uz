import { createHmac, timingSafeEqual } from 'node:crypto'

import { createError, deleteCookie, getCookie, setCookie, type H3Event } from 'h3'
import { z } from 'zod'

import { isEmployeePermission } from '~~/shared/auth/employees'

import { shouldUseSecureCookie } from './cookie-security'

const adminSessionSchema = z.object({
  branch_id: z.union([z.string(), z.number()]).transform(value => String(value)).optional().nullable(),
  company_code: z.string().trim().max(32).optional().nullable(),
  company_id: z.union([z.string(), z.number()]).transform(value => String(value)).optional().nullable(),
  id: z.string().trim().min(1),
  login: z.string().trim().min(1),
  marketplace_barbershop_id: z.union([z.string(), z.number()]).transform(value => String(value)).optional().nullable(),
  permissions: z.array(z.string()).transform(values => values.filter(isEmployeePermission)).optional(),
  role: z.string().trim().optional().nullable()
})

export type AdminSession = z.infer<typeof adminSessionSchema>

function getAdminSessionSecret(event: H3Event) {
  const secret = String(useRuntimeConfig(event).adminSessionSecret || '').trim()

  if (!secret) {
    throw createError({
      statusCode: 500,
      message: 'Секрет админ-сессии не настроен.'
    })
  }

  return secret
}

function signValue(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function getAdminSessionCookieName(event: H3Event) {
  return String(useRuntimeConfig(event).adminSessionCookieName)
}

export function getAdminBackendTokenCookieName(event: H3Event) {
  return String(useRuntimeConfig(event).adminBackendTokenCookieName)
}

export function getAdminBackendToken(event: H3Event) {
  return getCookie(event, getAdminBackendTokenCookieName(event)) || null
}

export function setAdminBackendToken(event: H3Event, token: string) {
  setCookie(event, getAdminBackendTokenCookieName(event), token, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: '/',
    sameSite: 'lax',
    secure: shouldUseSecureCookie(event)
  })
}

export function clearAdminBackendToken(event: H3Event) {
  deleteCookie(event, getAdminBackendTokenCookieName(event), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: shouldUseSecureCookie(event)
  })
}

/** HMAC-signed `base64url(json).signature` cookie value (admin and platform sessions). */
export function encodeSignedCookieValue(event: H3Event, payload: unknown) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${encodedPayload}.${signValue(encodedPayload, getAdminSessionSecret(event))}`
}

/** Parsed JSON of a signed cookie value, or null when missing/tampered. */
export function decodeSignedCookieValue(event: H3Event, rawCookie: string | null | undefined): unknown {
  if (!rawCookie) {
    return null
  }

  const [payload, signature] = rawCookie.split('.')

  if (!payload || !signature) {
    return null
  }

  if (!safeCompare(signature, signValue(payload, getAdminSessionSecret(event)))) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  }
  catch {
    return null
  }
}

export function getAdminSession(event: H3Event): AdminSession | null {
  const decodedPayload = decodeSignedCookieValue(event, getCookie(event, getAdminSessionCookieName(event)))

  if (!decodedPayload) {
    return null
  }

  const parsedSession = adminSessionSchema.safeParse(decodedPayload)
  return parsedSession.success ? parsedSession.data : null
}

export function setAdminSession(event: H3Event, payload: AdminSession) {
  const signedPayload = encodeSignedCookieValue(event, payload)

  setCookie(event, getAdminSessionCookieName(event), signedPayload, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: '/',
    sameSite: 'lax',
    secure: shouldUseSecureCookie(event)
  })
}

export function clearAdminSession(event: H3Event) {
  deleteCookie(event, getAdminSessionCookieName(event), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: shouldUseSecureCookie(event)
  })
}

/** Drops every tenant (company) session cookie: signed session, backend token and barber token. */
export function clearTenantSessionCookies(event: H3Event) {
  clearAdminSession(event)
  clearAdminBackendToken(event)
  deleteCookie(event, String(useRuntimeConfig(event).barberTokenCookieName), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: shouldUseSecureCookie(event)
  })
}
