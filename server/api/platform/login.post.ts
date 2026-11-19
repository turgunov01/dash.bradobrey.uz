import { createError, readBody } from 'h3'
import { z } from 'zod'

import { isPlatformOwnerRole, PLATFORM_OWNER_ROLE } from '~~/shared/auth/tenancy'

import { clearTenantSessionCookies } from '~~/server/utils/admin-session'
import { backendRequest } from '~~/server/utils/backend'
import { clearPlatformSession, setPlatformSession } from '~~/server/utils/platform-session'

const platformLoginSchema = z.object({
  login: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128)
})

type PlatformLoginResponse = {
  token?: string | null
  user?: { id?: string | null, login?: string | null, role?: string | null } | null
}

// POST /api/platform/login { login, password } -> backend POST /api/platform/login.
// The backend token stays in an HttpOnly cookie; the browser gets the user only.
export default defineEventHandler(async (event) => {
  const parsed = platformLoginSchema.safeParse(await readBody(event).catch(() => null))

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Введите логин и пароль.' })
  }

  const response = await backendRequest<PlatformLoginResponse>(event, {
    auth: 'none',
    body: parsed.data,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    method: 'POST',
    path: '/api/platform/login',
    session: 'platform'
  })

  const token = String(response.data?.token || '').trim()
  const user = response.data?.user

  if (!token || !user?.id || !isPlatformOwnerRole(user.role)) {
    throw createError({ statusCode: 502, message: 'Backend platform login returned an unexpected response.' })
  }

  // One account per browser: drop any company session before the platform one.
  clearTenantSessionCookies(event)
  clearPlatformSession(event)

  const session = { id: String(user.id), login: String(user.login || parsed.data.login), role: PLATFORM_OWNER_ROLE } as const
  setPlatformSession(event, token, session)

  return { authenticated: true, user: session }
})
