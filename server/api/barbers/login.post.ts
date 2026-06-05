import { createError, readBody, type H3Event } from 'h3'

import { dashboardLegacyRoles } from '~~/shared/auth/employees'
import { loginSchema, type LoginPayload } from '~~/shared/schemas'

import { ensureAdminNetworkAccess } from '~~/server/utils/admin-access'
import {
  clearAdminBackendToken,
  clearAdminSession,
  setAdminBackendToken,
  setAdminSession
} from '~~/server/utils/admin-session'
import { backendRequest } from '~~/server/utils/backend'
import { clearBarberToken, setBarberToken } from '~~/server/utils/session'

type LoginResult = {
  authenticated: boolean
  token?: string
  user: Record<string, any> | null
}

type AdminLoginResponse = {
  token?: string | null
  user?: Record<string, any> | null
}

type LegacyLoginResponse = {
  token?: string | null
  user?: Record<string, any> | null
}

const adminRoles = new Set<string>(dashboardLegacyRoles)

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeOptionalId(value: unknown) {
  const normalized = normalizeText(value)
  return normalized || null
}

function getErrorStatus(error: any) {
  return Number(error?.statusCode || error?.response?.status || error?.status || 500)
}

function shouldTryLegacyLogin(error: any) {
  return [401, 403, 404, 405].includes(getErrorStatus(error))
}

function buildAdminUser(rawUser: Record<string, any>, fallbackLogin: string) {
  const login = normalizeText(rawUser.login) || fallbackLogin
  const role = normalizeText(rawUser.role).toLowerCase()

  return {
    branch_id: normalizeOptionalId(rawUser.branch_id),
    id: normalizeText(rawUser.id),
    login,
    marketplace_barbershop_id: normalizeOptionalId(rawUser.marketplace_barbershop_id),
    name: normalizeText(rawUser.name) || login || 'Administrator',
    phone: rawUser.phone ?? null,
    role
  }
}

function assertAdminLoginResponse(data: AdminLoginResponse, fallbackLogin: string) {
  const token = normalizeText(data.token)
  const rawUser = data.user || null
  const role = normalizeText(rawUser?.role).toLowerCase()

  if (!token) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Admin login did not return token.'
    })
  }

  if (!rawUser || !normalizeText(rawUser.id)) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Admin login did not return user id.'
    })
  }

  if (!adminRoles.has(role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin dashboard login is allowed only for admin_network/admin_branch.'
    })
  }

  return {
    token,
    user: buildAdminUser(rawUser, fallbackLogin)
  }
}

async function loginAdmin(event: H3Event, payload: LoginPayload): Promise<LoginResult> {
  const response = await backendRequest<AdminLoginResponse>(event, {
    auth: 'none',
    body: {
      login: payload.login,
      password: payload.password
    },
    method: 'POST',
    path: '/api/barbers/admin/login'
  })

  const { token, user } = assertAdminLoginResponse(response.data || {}, payload.login)

  clearBarberToken(event)
  clearAdminBackendToken(event)
  clearAdminSession(event)
  setAdminBackendToken(event, token)
  setAdminSession(event, {
    branch_id: user.branch_id,
    id: user.id,
    login: user.login,
    marketplace_barbershop_id: user.marketplace_barbershop_id,
    role: user.role
  })

  return {
    authenticated: true,
    token,
    user
  }
}

async function loginLegacyMerchant(event: H3Event, payload: LoginPayload, adminError: any): Promise<LoginResult> {
  const response = await backendRequest<LegacyLoginResponse>(event, {
    auth: 'none',
    body: {
      login: payload.login,
      password: payload.password,
      ...(payload.branch_id ? { branch_id: payload.branch_id } : {})
    },
    method: 'POST',
    path: '/api/barbers/login'
  })

  const accessUser = await ensureAdminNetworkAccess(event, {
    id: response.data?.user?.id,
    login: response.data?.user?.login || payload.login
  })

  const user = response.data?.user
    ? {
        ...response.data.user,
        ...(accessUser?.role ? { role: accessUser.role } : {}),
        ...(accessUser?.marketplace_barbershop_id ? { marketplace_barbershop_id: accessUser.marketplace_barbershop_id } : {})
      }
    : null
  const role = normalizeText(user?.role).toLowerCase()

  if (role !== 'merchant' && role !== 'partner') {
    throw adminError
  }

  if (response.data?.token) {
    clearAdminBackendToken(event)
    clearAdminSession(event)
    setBarberToken(event, response.data.token)
  }

  return {
    authenticated: Boolean(response.data?.token),
    token: response.data?.token || undefined,
    user
  }
}

export default defineEventHandler(async (event): Promise<LoginResult> => {
  const payload = loginSchema.parse(await readBody(event))

  try {
    return await loginAdmin(event, payload)
  }
  catch (adminError: any) {
    if (!shouldTryLegacyLogin(adminError)) {
      throw adminError
    }

    try {
      return await loginLegacyMerchant(event, payload, adminError)
    }
    catch {
      throw adminError
    }
  }
})
