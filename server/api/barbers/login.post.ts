import { compare } from 'bcryptjs'
import { createError, readBody } from 'h3'

import { loginSchema } from '~~/shared/schemas'

import {
  ensureAdminNetworkAccess,
  findSupabaseUserByLogin,
  toDashboardUser
} from '~~/server/utils/admin-access'
import { clearAdminSession, setAdminSession } from '~~/server/utils/admin-session'
import { backendRequest } from '~~/server/utils/backend'
import { clearBarberToken, setBarberToken } from '~~/server/utils/session'

export default defineEventHandler(async (event): Promise<{ authenticated: boolean, user: Record<string, any> | null, token?: string }> => {
  const payload = loginSchema.parse(await readBody(event))
  const supabaseUser = await findSupabaseUserByLogin(event, payload.login, { includePasswordHash: true })

  if (supabaseUser) {
    const hasValidPassword = Boolean(
      supabaseUser.password_hash && await compare(payload.password, supabaseUser.password_hash)
    )

    if (!hasValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Неверный логин или пароль.'
      })
    }

    const accessUser = await ensureAdminNetworkAccess(event, {
      id: supabaseUser.id,
      login: supabaseUser.login || payload.login
    })

    clearBarberToken(event)
    clearAdminSession(event)
    setAdminSession(event, {
      id: String(accessUser.id),
      login: accessUser.login || payload.login
    })

    let adminToken: string | undefined

    try {
      const response = await backendRequest<{ token?: string }>(event, {
        auth: 'none',
        body: {
          login: payload.login,
          password: payload.password
        },
        method: 'POST',
        path: '/api/barbers/admin/login'
      })

      if (typeof response.data?.token === 'string' && response.data.token.trim()) {
        adminToken = response.data.token.trim()
      }
    }
    catch {
      // Dashboard login should still work even if backend admin token is unavailable.
      adminToken = undefined
    }

    return {
      authenticated: true,
      user: toDashboardUser(accessUser),
      token: adminToken
    }
  }

  const backendPayload = {
    login: payload.login,
    password: payload.password,
    ...(payload.branch_id ? { branch_id: payload.branch_id } : {})
  }
  const response = await backendRequest<{ token?: string, user?: Record<string, any> }>(event, {
    auth: 'none',
    body: backendPayload,
    method: 'POST',
    path: '/api/barbers/login'
  })
  const accessUser = await ensureAdminNetworkAccess(event, {
    id: response.data?.user?.id,
    login: response.data?.user?.login || payload.login
  })

  if (response.data?.token) {
    clearAdminSession(event)
    setBarberToken(event, response.data.token)
  }

  return {
    authenticated: Boolean(response.data?.token),
    user: response.data?.user
      ? {
          ...response.data.user,
          ...(accessUser?.role ? { role: accessUser.role } : {})
        }
      : null,
    token: response.data?.token
  }
})
