import { createError, readBody, type H3Event } from 'h3'

import { getEffectiveEmployeePermissions, marketplaceMerchantRoles } from '~~/shared/auth/employees'
import { loginSchema, type LoginPayload } from '~~/shared/schemas'

import { assertDashboardAccessUser } from '~~/server/utils/admin-access'
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

type LegacyLoginResponse = {
  token?: string | null
  user?: Record<string, any> | null
}

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

function getErrorStatus(error: any) {
  return Number(error?.statusCode || error?.response?.status || error?.status || 500)
}

function logBackendLoginRequest(event: H3Event, path: string, payload: LoginPayload, source: string) {
  if (process.env.NODE_ENV === 'production') return

  console.log(`${debugPrefix} request`, {
    body: getLoginDebugBody(payload),
    method: 'POST',
    source,
    url: getBackendUrl(event, path)
  })
}

function logBackendLoginResponse(path: string, status: number, data: LegacyLoginResponse, source: string) {
  if (process.env.NODE_ENV === 'production') return

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
  if (process.env.NODE_ENV === 'production') return

  console.error(`${debugPrefix} error`, {
    error: getErrorDebugPayload(error),
    path,
    source
  })
}

function assertBackendLoginResponse(data: LegacyLoginResponse) {
  const token = normalizeText(data.token)
  const rawUser = data.user || null

  if (!token) {
    throw createError({
      statusCode: 502,
      message: 'Backend login did not return token.'
    })
  }

  if (!rawUser || !normalizeText(rawUser.id)) {
    throw createError({
      statusCode: 502,
      message: 'Backend login did not return user id.'
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
    permissions: getEffectiveEmployeePermissions({
      permissions: rawUser.permissions ?? accessUser.permissions,
      role
    }),
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
    permissions: user.permissions,
    role: user.role
  })
}

async function loginBackend(event: H3Event, payload: LoginPayload): Promise<LoginResult> {
  const path = '/api/barbers/login'
  const body = {
    login: payload.login,
    password: payload.password
  }

  logBackendLoginRequest(event, path, payload, 'primary')

  let response

  try {
    response = await backendRequest<LegacyLoginResponse>(event, {
      auth: 'none',
      body,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
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
  const accessUser = assertDashboardAccessUser(rawUser)
  const user = buildDashboardLoginUser(rawUser, accessUser, payload.login)
  const role = normalizeText(user.role).toLowerCase()

  if (!dashboardLoginRoles.has(role)) {
    throw createError({
      statusCode: 403,
      message: 'Dashboard login is allowed only for backend dashboard roles.'
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
  const parsedPayload = loginSchema.safeParse(await readBody(event))

  if (!parsedPayload.success) {
    throw createError({
      statusCode: 400,
      message: 'Введите корректные логин и пароль.'
    })
  }

  const payload = parsedPayload.data

  return loginBackend(event, payload)
})
