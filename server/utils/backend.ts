import {
  createError,
  getHeader,
  getMethod,
  getQuery,
  getRequestURL,
  readBody,
  readFormData,
  setResponseStatus,
  type H3Event
} from 'h3'

import { getSessionEndReason } from '~~/shared/auth/tenancy'

import { getBarberToken } from './session'
import { clearTenantSessionCookies, getAdminBackendToken } from './admin-session'

type AuthMode = 'none' | 'optional' | 'required'
type BackendMethod = 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT'
type BackendBody = BodyInit | FormData | Record<string, unknown> | undefined
type BackendResponse<T> = {
  data: T
  headers: Headers
  status: number
}

type BackendRequestOptions = {
  path: string
  method?: string
  query?: Record<string, unknown>
  body?: BackendBody
  auth?: AuthMode
  headers?: HeadersInit
  /**
   * Tenant requests (default) drop the company session cookies when the
   * backend revokes the session (TOKEN_ROLE_STALE, COMPANY_SUSPENDED, ...).
   * Platform-owner requests manage their own cookies.
   */
  session?: 'tenant' | 'platform'
}

const backendMethods = new Set<BackendMethod>(['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'])
const forwardedHeaderNames = ['authorization', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-port', 'user-agent', 'accept-language'] as const

function normalizeMethod(method?: string): BackendMethod {
  const normalizedMethod = method?.toUpperCase() as BackendMethod | undefined

  if (normalizedMethod && backendMethods.has(normalizedMethod)) {
    return normalizedMethod
  }

  return 'GET'
}

function buildForwardedHeaders(event: H3Event, headers?: HeadersInit) {
  const mergedHeaders = new Headers(headers)

  for (const headerName of forwardedHeaderNames) {
    const headerValue = getHeader(event, headerName)

    if (headerValue && !mergedHeaders.has(headerName)) {
      mergedHeaders.set(headerName, headerValue)
    }
  }

  return Object.fromEntries(mergedHeaders.entries())
}

function isHtmlResponse(value: unknown) {
  return typeof value === 'string' && /<html[\s>]/i.test(value)
}

function getUpstreamErrorMessage(error: any, method: BackendMethod, path: string) {
  const data = error?.response?._data
  const statusCode = error?.response?.status || 500
  const statusText = error?.response?.statusText || error?.response?.statusMessage || ''

  if (data && typeof data === 'object' && typeof data.message === 'string') {
    return data.message
  }

  if (data && typeof data === 'object' && typeof data.error === 'string') {
    return data.error
  }

  if (isHtmlResponse(data)) {
    return `Upstream API returned ${statusCode}${statusText ? ` ${statusText}` : ''} for ${method} ${path}.`
  }

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  return error?.message || 'Ошибка запроса к бэкенду.'
}

export async function readIncomingBody(event: H3Event): Promise<BackendBody> {
  const method = getMethod(event)

  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return undefined
  }

  const contentType = getHeader(event, 'content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    return await readFormData(event)
  }

  try {
    return await readBody(event)
  }
  catch {
    return undefined
  }
}

export async function backendRequest<T>(event: H3Event, options: BackendRequestOptions): Promise<BackendResponse<T>> {
  const config = useRuntimeConfig(event)
  const token = getBarberToken(event) || getAdminBackendToken(event)
  const authMode = options.auth ?? 'optional'
  const explicitHeaders = new Headers(options.headers)
  const forwardedHeaders = buildForwardedHeaders(event, options.headers)

  if (authMode === 'none' && !explicitHeaders.has('authorization')) {
    delete (forwardedHeaders as any).authorization
  }

  const hasAuthorizationHeader = Boolean((forwardedHeaders as any).authorization)
  const method = normalizeMethod(options.method || getMethod(event))

  if (authMode === 'required' && !token && !hasAuthorizationHeader) {
    throw createError({
      statusCode: 401,
      message: 'Требуется сессия барбера.'
    })
  }

  try {
    const response = await $fetch.raw<T>(options.path, {
      baseURL: config.public.apiBase,
      body: options.body,
      headers: {
        ...forwardedHeaders,
        ...(authMode !== 'none' && token && !hasAuthorizationHeader ? { Authorization: `Bearer ${token}` } : {})
      },
      method,
      query: options.query
    })

    return {
      data: response._data as T,
      headers: response.headers,
      status: response.status
    }
  }
  catch (error: any) {
    const statusCode = error?.response?.status || 500
    const message = getUpstreamErrorMessage(error, method, options.path)

    if ((options.session ?? 'tenant') === 'tenant' && getSessionEndReason({ data: error?.response?._data })) {
      clearTenantSessionCookies(event)
    }

    throw createError({
      data: isHtmlResponse(error?.response?._data) ? undefined : error?.response?._data,
      message,
      statusCode,
      statusMessage: error?.response?.statusText || 'Upstream API Error'
    })
  }
}

export async function proxyBackend<T>(event: H3Event, path: string, auth: AuthMode = 'optional'): Promise<T> {
  const response = await backendRequest<T>(event, {
    auth,
    body: await readIncomingBody(event),
    method: normalizeMethod(getMethod(event)),
    path,
    query: getQuery(event)
  })

  setResponseStatus(event, response.status)

  return response.data
}

export async function proxyBackendCurrentPath<T>(event: H3Event, auth: AuthMode = 'optional'): Promise<T> {
  return proxyBackend<T>(event, getRequestURL(event).pathname, auth)
}
