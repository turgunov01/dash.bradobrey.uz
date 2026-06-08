import { createError, readBody, type H3Event } from 'h3'

import { backendDashboardRoles, marketplaceMerchantRoles } from '~~/shared/auth/employees'
import { loginSchema, type LoginPayload } from '~~/shared/schemas'

import { ensureAdminNetworkAccess } from '~~/server/utils/admin-access'
import {
  clearAdminBackendToken,
  clearAdminSession,
  setAdminBackendToken,
  setAdminSession
} from '~~/server/utils/admin-session'
import { backendRequest } from '~~/server/utils/backend'
import { clearBarberToken } from '~~/server/utils/session'

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

const adminRoles = new Set<string>(backendDashboardRoles)
const dashboardLoginRoles = new Set<string>(marketplaceMerchantRoles)
const debugPrefix = '[barbers-login-debug]'

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeOptionalId(value: unknown) {
  const normalized = normalizeText(value)
  return normalized || null
}

function sanitizeDebugValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeDebugValue(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        /password|token|authorization/i.test(key) ? '[redacted]' : sanitizeDebugValue(item)
      ])
    )
  }

  return value
}

function getBackendUrl(event: H3Event, path: string) {
  const config = useRuntimeConfig(event)
  const baseURL = String(config.public.apiBase || '').replace(/\/$/, '')

  return `${baseURL}${path}`
}

function getLoginDebugBody(payload: LoginPayload) {
  return {
    branch_id: normalizeOptionalId(payload.branch_id),
    login: payload.login,
    password: '[redacted]',
    passwordLength: String(payload.password || '').length
  }
}

function getUserDebugPayload(user: Record<string, any> | null | undefined) {
  if (!user) return null

  return {
    branch_id: normalizeOptionalId(user.branch_id),
    id: normalizeText(user.id),
    login: normalizeText(user.login),
    marketplace_barbershop_id: normalizeOptionalId(user.marketplace_barbershop_id),
    role: normalizeText(user.role).toLowerCase()
  }
}

function getErrorDebugPayload(error: any) {
  return {
    data: sanitizeDebugValue(error?.data || error?.response?._data || null),
    message: error?.message || null,
    status: getErrorStatus(error),
    statusMessage: error?.statusMessage || error?.response?.statusText || null
  }
}

function logBackendLoginRequest(event: H3Event, path: string, payload: LoginPayload, source: string) {
  console.log(`${debugPrefix} request`, {
    body: getLoginDebugBody(payload),
    method: 'POST',
    source,
    url: getBackendUrl(event, path)
  })
}

function logBackendLoginResponse(path: string, status: number, data: LegacyLoginResponse | AdminLoginResponse, source: string) {
  console.log(`${debugPrefix} response`, {
    authenticated: Boolean(data?.token),
    path,
    source,
    status,
    token: data?.token ? '[redacted]' : null,
    user: getUserDebugPayload(data?.user)
  })
}

function logBackendLoginError(path: string, error: any, source: string) {
  console.error(`${debugPrefix} error`, {
    error: getErrorDebugPayload(error),
    path,
    source
  })
}

function logBackendLoginFallback(loginError: any) {
  console.warn(`${debugPrefix} fallback`, {
    fallbackPath: '/api/barbers/admin/login',
    primaryError: getErrorDebugPayload(loginError),
    primaryPath: '/api/barbers/login',
    reason: 'Primary /api/barbers/login returned a fallback-eligible status.'
  })
}

function getErrorStatus(error: any) {
  return Number(error?.statusCode || error?.response?.status || error?.status || 500)
}

function shouldTryAdminLoginFallback(error: any) {
  return [400, 401, 403, 404, 405].includes(getErrorStatus(error))
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
      statusMessage: 'Admin dashboard login is allowed only for backend dashboard roles.'
    })
  }

  return {
    token,
    user: buildAdminUser(rawUser, fallbackLogin)
  }
}

function assertBackendLoginResponse(data: LegacyLoginResponse) {
  const token = normalizeText(data.token)
  const rawUser = data.user || null

  if (!token) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Backend login did not return token.'
    })
  }

  if (!rawUser || !normalizeText(rawUser.id)) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Backend login did not return user id.'
    })
  }

  return {
    token,
    rawUser
  }
}

function buildDashboardLoginUser(
  rawUser: Record<string, any>,
  accessUser: Record<string, any>,
  fallbackLogin: string
) {
  const login = normalizeText(rawUser.login) || normalizeText(accessUser.login) || fallbackLogin
  const role = normalizeText(accessUser.role || rawUser.role).toLowerCase()

  return {
    ...rawUser,
    branch_id: normalizeOptionalId(accessUser.branch_id ?? rawUser.branch_id),
    id: normalizeText(rawUser.id || accessUser.id),
    login,
    marketplace_barbershop_id: normalizeOptionalId(
      accessUser.marketplace_barbershop_id ?? rawUser.marketplace_barbershop_id
    ),
    name: normalizeText(rawUser.name) || login || 'Administrator',
    phone: rawUser.phone ?? accessUser.phone ?? null,
    role
  }
}

function setDashboardLoginSession(event: H3Event, token: string, user: Record<string, any>) {
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
}

async function loginAdmin(event: H3Event, payload: LoginPayload): Promise<LoginResult> {
  const path = '/api/barbers/admin/login'

  logBackendLoginRequest(event, path, payload, 'admin-fallback')

  let response

  try {
    response = await backendRequest<AdminLoginResponse>(event, {
      auth: 'none',
      body: {
        login: payload.login,
        password: payload.password
      },
      method: 'POST',
      path
    })
  }
  catch (error) {
    logBackendLoginError(path, error, 'admin-fallback')
    throw error
  }

  logBackendLoginResponse(path, response.status, response.data || {}, 'admin-fallback')

  const { token, user } = assertAdminLoginResponse(response.data || {}, payload.login)

  setDashboardLoginSession(event, token, user)

  return {
    authenticated: true,
    token,
    user
  }
}

async function loginBackend(event: H3Event, payload: LoginPayload): Promise<LoginResult> {
  const path = '/api/barbers/login'
  const body = {
    login: payload.login,
    password: payload.password,
    ...(payload.branch_id ? { branch_id: payload.branch_id } : {})
  }

  logBackendLoginRequest(event, path, payload, 'primary')

  let response

  try {
    response = await backendRequest<LegacyLoginResponse>(event, {
      auth: 'none',
      body,
      method: 'POST',
      path
    })
  }
  catch (error) {
    logBackendLoginError(path, error, 'primary')
    throw error
  }

  logBackendLoginResponse(path, response.status, response.data || {}, 'primary')

  const { token, rawUser } = assertBackendLoginResponse(response.data || {})
  const accessUser = await ensureAdminNetworkAccess(event, {
    id: rawUser.id,
    login: rawUser.login || payload.login
  })
  const user = buildDashboardLoginUser(rawUser, accessUser, payload.login)
  const role = normalizeText(user.role).toLowerCase()

  if (!dashboardLoginRoles.has(role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Dashboard login is allowed only for backend dashboard roles.'
    })
  }

  setDashboardLoginSession(event, token, user)

  return {
    authenticated: true,
    token,
    user
  }
}

export default defineEventHandler(async (event): Promise<LoginResult> => {
  const payload = loginSchema.parse(await readBody(event))

  try {
    return await loginBackend(event, payload)
  }
  catch (loginError: any) {
    if (!shouldTryAdminLoginFallback(loginError)) {
      throw loginError
    }

    logBackendLoginFallback(loginError)

    try {
      return await loginAdmin(event, payload)
    }
    catch {
      throw loginError
    }
  }
})
