import {
  createError,
  getHeader,
  getMethod,
  getQuery,
  readBody,
  readFormData,
  setResponseStatus,
  type H3Event
} from 'h3'

import { getBarberToken } from './session'

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
}

const backendMethods = new Set<BackendMethod>(['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'])
const forwardedHeaderNames = ['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-port', 'user-agent', 'accept-language'] as const

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
  const token = getBarberToken(event)
  const authMode = options.auth ?? 'optional'

  if (authMode === 'required' && !token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Требуется сессия барбера.'
    })
  }

  try {
    const response = await $fetch.raw<T>(options.path, {
      baseURL: config.public.apiBase,
      body: options.body,
      headers: {
        ...buildForwardedHeaders(event, options.headers),
        ...(authMode !== 'none' && token ? { Authorization: `Bearer ${token}` } : {})
      },
      method: normalizeMethod(options.method || getMethod(event)),
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
    const statusMessage = error?.response?._data?.message || error?.message || 'Ошибка запроса к бэкенду.'

    throw createError({
      data: error?.response?._data,
      statusCode,
      statusMessage
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
