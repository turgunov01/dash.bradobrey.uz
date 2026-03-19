import { createHmac, timingSafeEqual } from 'node:crypto'

import { createError, deleteCookie, getCookie, setCookie, type H3Event } from 'h3'
import { z } from 'zod'

import { shouldUseSecureCookie } from './cookie-security'

const adminSessionSchema = z.object({
  id: z.string().trim().min(1),
  login: z.string().trim().min(1)
})

export type AdminSession = z.infer<typeof adminSessionSchema>

function getAdminSessionSecret(event: H3Event) {
  const secret = String(useRuntimeConfig(event).adminSessionSecret || '').trim()

  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Секрет админ-сессии не настроен.'
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

export function getAdminSession(event: H3Event): AdminSession | null {
  const rawCookie = getCookie(event, getAdminSessionCookieName(event))

  if (!rawCookie) {
    return null
  }

  const [payload, signature] = rawCookie.split('.')

  if (!payload || !signature) {
    return null
  }

  const expectedSignature = signValue(payload, getAdminSessionSecret(event))

  if (!safeCompare(signature, expectedSignature)) {
    return null
  }

  try {
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    const parsedSession = adminSessionSchema.safeParse(decodedPayload)

    return parsedSession.success ? parsedSession.data : null
  }
  catch {
    return null
  }
}

export function setAdminSession(event: H3Event, payload: AdminSession) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signedPayload = `${encodedPayload}.${signValue(encodedPayload, getAdminSessionSecret(event))}`

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
