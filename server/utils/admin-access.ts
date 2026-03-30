import { createError, type H3Event } from 'h3'
import { z } from 'zod'

const identifierSchema = z.union([z.string(), z.number()]).transform(value => String(value))
const optionalIdentifierSchema = identifierSchema.optional().nullable()
const optionalTextSchema = z.string().trim().optional().nullable()

const accessUserSchema = z.object({
  branch_id: optionalIdentifierSchema,
  id: identifierSchema,
  login: optionalTextSchema,
  phone: optionalTextSchema,
  password_hash: z.string().optional().nullable(),
  role: optionalTextSchema
}).passthrough()

type AccessCandidate = {
  id?: number | string | null
  login?: string | null
}

type AccessUser = z.infer<typeof accessUserSchema>

function getSupabaseAccessConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  const supabaseUrl = String(config.supabaseUrl || '').trim().replace(/\/$/, '')
  const serviceRoleKey = String(config.supabaseServiceRoleKey || '').trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Контроль доступа Supabase не настроен.'
    })
  }

  return {
    serviceRoleKey,
    supabaseUrl
  }
}

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function isMissingColumnError(error: any, column: string) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [
    payload?.message,
    payload?.details,
    error?.message
  ].filter(Boolean).join(' ')

  return code === '42703'
    || code === 'PGRST204'
    || (
      message.includes(column)
      && /does not exist|unknown column|not found|could not find|schema cache/i.test(message)
    )
}

async function fetchSupabaseUsers(
  event: H3Event,
  query: Record<string, string | number>
) {
  const { serviceRoleKey, supabaseUrl } = getSupabaseAccessConfig(event)

  return $fetch<unknown[]>('/rest/v1/users', {
    baseURL: supabaseUrl,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    },
    query
  })
}

async function queryAccessUser(
  event: H3Event,
  field: 'id' | 'login',
  value: string,
  select: string
): Promise<AccessUser | null> {
  const { serviceRoleKey, supabaseUrl } = getSupabaseAccessConfig(event)

  try {
    const rows = await $fetch<unknown[]>('/rest/v1/users', {
      baseURL: supabaseUrl,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      },
      query: {
        [field]: `eq.${value}`,
        limit: 1,
        select
      }
    })

    if (!Array.isArray(rows) || !rows[0]) {
      return null
    }

    const parsed = accessUserSchema.safeParse(rows[0])

    return parsed.success ? parsed.data : null
  }
  catch (error: any) {
    throw createError({
      data: getSupabaseErrorPayload(error),
      statusCode: 502,
      statusMessage: 'Не удалось проверить доступ к панели через Supabase.'
    })
  }
}

export async function listSupabaseUsers(
  event: H3Event,
  options: {
    limit?: number
    role?: string | null
    roles?: string[] | null
    branchId?: string | null
  } = {}
) {
  const roleFilter = Array.isArray(options.roles) && options.roles.length
    ? `in.(${options.roles.map(role => `"${role}"`).join(',')})`
    : null

  const baseQuery: Record<string, string | number> = {
    limit: options.limit || 500,
    order: 'login.asc.nullslast',
    ...(roleFilter
      ? { role: roleFilter }
      : options.role
        ? { role: `eq.${options.role}` }
        : {}),
    ...(options.branchId ? { branch_id: `eq.${options.branchId}` } : {})
  }

  try {
    let rows: unknown[]

    try {
      rows = await fetchSupabaseUsers(event, {
        ...baseQuery,
        select: 'id,login,phone,role,branch_id'
      })
    }
    catch (error: any) {
      if (!isMissingColumnError(error, 'phone')) {
        throw error
      }

      rows = await fetchSupabaseUsers(event, {
        ...baseQuery,
        select: 'id,login,role,branch_id'
      })
    }

    if (!Array.isArray(rows)) {
      return [] as AccessUser[]
    }

    const parsedRows: AccessUser[] = []

    for (const row of rows) {
      const parsed = accessUserSchema.safeParse(row)

      if (parsed.success) {
        parsedRows.push(parsed.data)
      }
    }

    return parsedRows
  }
  catch (error: any) {
    throw createError({
      data: getSupabaseErrorPayload(error),
      statusCode: 502,
      statusMessage: 'Не удалось получить список пользователей из Supabase.'
    })
  }
}

export async function findSupabaseUserById(event: H3Event, id: string) {
  const normalizedId = String(id || '').trim()

  if (!normalizedId) {
    return null
  }

  return queryAccessUser(event, 'id', normalizedId, 'id,login,role,branch_id')
}

export async function findSupabaseUserByLogin(
  event: H3Event,
  login: string,
  options: {
    includePasswordHash?: boolean
  } = {}
) {
  const normalizedLogin = String(login || '').trim()

  if (!normalizedLogin) {
    return null
  }

  const select = options.includePasswordHash
    ? 'id,login,role,branch_id,password_hash'
    : 'id,login,role,branch_id'

  return queryAccessUser(event, 'login', normalizedLogin, select)
}

export function assertAdminNetworkRole(accessUser: AccessUser) {
  if (accessUser.role !== 'admin_network' && accessUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Доступ к панели разрешен только пользователям admin_network или admin.'
    })
  }

  return accessUser
}

export function toDashboardUser(accessUser: AccessUser) {
  const login = accessUser.login ? String(accessUser.login).trim() : null

  return {
    id: String(accessUser.id),
    login,
    name: login || 'Администратор',
    phone: null,
    role: accessUser.role || null
  }
}

function requireAccessUser(accessUser: AccessUser | null) {
  if (!accessUser) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Для доступа к панели требуется соответствующий пользователь в таблице users Supabase.'
    })
  }

  return accessUser
}

export async function ensureAdminNetworkAccess(event: H3Event, candidate: AccessCandidate) {
  const userId = candidate.id == null ? '' : String(candidate.id).trim()
  const login = String(candidate.login || '').trim()

  if (userId) {
    const accessUser = await findSupabaseUserById(event, userId)

    if (accessUser) {
      return assertAdminNetworkRole(accessUser)
    }

    if (!login) {
      return assertAdminNetworkRole(requireAccessUser(accessUser))
    }
  }

  if (!login) {
    return assertAdminNetworkRole(requireAccessUser(null))
  }

  const accessUser = await findSupabaseUserByLogin(event, login)

  return assertAdminNetworkRole(requireAccessUser(accessUser))
}
