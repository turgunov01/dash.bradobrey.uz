import { hash } from 'bcryptjs'
import { createError, type H3Event } from 'h3'

import { employeeRoles, isEmployeePermission, operationalBarberRoles } from '~~/shared/auth/employees'
import type {
  BarberRegisterPayload,
  BarberUpdatePayload,
  EmployeePermission,
  EmployeeRole
} from '~~/shared/schemas'

type SupabaseUserRow = {
  branch_id?: string | null
  id: string
  login?: string | null
  role?: string | null
}

type SupabaseBarberRow = {
  branch_id?: string | null
  id: string
  is_active?: boolean | null
  is_authorized?: boolean | null
  is_on_shift?: boolean | null
  name?: string | null
  photo_url?: string | null
  phone?: string | null
  specialization?: string | null
}

type SupabasePermissionRow = {
  permission?: string | null
  user_id: string
}

type SupabaseRequestOptions = {
  body?: Record<string, unknown> | Array<Record<string, unknown>>
  method?: 'DELETE' | 'GET' | 'PATCH' | 'POST'
  prefer?: string
  query?: Record<string, string | number>
}

type EmployeeDirectoryItem = {
  branch_id: string | null
  id: string
  login: string | null
  name: string | null
  permissions: EmployeePermission[]
  photo_url: string | null
  phone: string | null
  role: string | null
  specialization: string | null
}

function getSupabaseConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  const supabaseUrl = String(config.supabaseUrl || '').trim().replace(/\/$/, '')
  const serviceRoleKey = String(config.supabaseServiceRoleKey || '').trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase не настроен для управления сотрудниками.'
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

function getSupabaseHeaders(serviceRoleKey: string, prefer?: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...(prefer ? { Prefer: prefer } : {})
  }
}

function isMissingPermissionsTableError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [
    payload?.message,
    payload?.details,
    error?.message
  ].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || /user_permissions/i.test(message) && /does not exist|not found|schema cache/i.test(message)
}

function isRoleConstraintError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [
    payload?.message,
    payload?.details,
    error?.message
  ].filter(Boolean).join(' ')

  return code === '23514'
    || /users_role_check|check constraint|role/i.test(message)
}

function ensureRoleMigrationApplied(error: any): never {
  throw createError({
    data: getSupabaseErrorPayload(error),
    statusCode: 500,
    statusMessage: 'В Supabase не применена миграция ролей users_role_check для новых ролей сотрудников.'
  })
}

async function requestSupabase<T>(
  event: H3Event,
  table: string,
  options: SupabaseRequestOptions = {}
) {
  const { serviceRoleKey, supabaseUrl } = getSupabaseConfig(event)

  try {
    return await $fetch<T>(`/rest/v1/${table}`, {
      baseURL: supabaseUrl,
      body: options.body,
      headers: getSupabaseHeaders(serviceRoleKey, options.prefer),
      method: options.method || 'GET',
      query: options.query
    })
  }
  catch (error: any) {
    const payload = getSupabaseErrorPayload(error)

    throw createError({
      data: payload,
      statusCode: error?.response?.status || 502,
      statusMessage: payload?.message || error?.message || 'Ошибка запроса к Supabase.'
    })
  }
}

function normalizeNullableText(value: unknown) {
  const text = String(value || '').trim()

  return text || null
}

function uniquePermissions(permissions: EmployeePermission[]) {
  return [...new Set(permissions)] as EmployeePermission[]
}

function buildRoleFilter(roles: readonly string[]) {
  return `in.(${roles.map(role => `"${role}"`).join(',')})`
}

function requireEmployeeId(id: string) {
  const normalizedId = String(id || '').trim()

  if (!normalizedId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан идентификатор сотрудника.'
    })
  }

  return normalizedId
}

async function ensurePermissionsStorage(event: H3Event) {
  try {
    await requestSupabase<SupabasePermissionRow[]>(event, 'user_permissions', {
      query: {
        limit: 1,
        select: 'user_id,permission'
      }
    })
  }
  catch (error: any) {
    if (isMissingPermissionsTableError(error)) {
      throw createError({
        statusCode: 500,
        statusMessage: 'В Supabase не применена миграция таблицы user_permissions.'
      })
    }

    throw error
  }
}

async function findUserById(event: H3Event, id: string) {
  const rows = await requestSupabase<SupabaseUserRow[]>(event, 'users', {
    query: {
      id: `eq.${id}`,
      limit: 1,
      select: 'id,login,branch_id,role'
    }
  })

  return rows[0] || null
}

async function findBarberById(event: H3Event, id: string) {
  const rows = await requestSupabase<SupabaseBarberRow[]>(event, 'barbers', {
    query: {
      id: `eq.${id}`,
      limit: 1,
      select: 'id,name,photo_url,phone,specialization,branch_id,is_active,is_authorized,is_on_shift'
    }
  })

  return rows[0] || null
}

async function ensureUniqueLogin(event: H3Event, id: string | null, login: string) {
  const rows = await requestSupabase<Array<{ id: string }>>(event, 'users', {
    query: {
      ...(id ? { id: `neq.${id}` } : {}),
      limit: 1,
      login: `eq.${login}`,
      select: 'id'
    }
  })

  if (rows[0]) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Логин уже занят другим сотрудником.'
    })
  }
}

async function fetchBarbersByIds(event: H3Event, ids: string[]) {
  if (!ids.length) {
    return [] as SupabaseBarberRow[]
  }

  return requestSupabase<SupabaseBarberRow[]>(event, 'barbers', {
    query: {
      id: `in.(${ids.join(',')})`,
      select: 'id,name,photo_url,phone,specialization,branch_id,is_active,is_authorized,is_on_shift'
    }
  })
}

async function fetchPermissionsByUserIds(event: H3Event, ids: string[]) {
  if (!ids.length) {
    return [] as SupabasePermissionRow[]
  }

  try {
    return await requestSupabase<SupabasePermissionRow[]>(event, 'user_permissions', {
      query: {
        select: 'user_id,permission',
        user_id: `in.(${ids.join(',')})`
      }
    })
  }
  catch (error: any) {
    if (isMissingPermissionsTableError(error)) {
      return []
    }

    throw error
  }
}

async function replaceUserPermissions(event: H3Event, userId: string, permissions: EmployeePermission[]) {
  await requestSupabase<SupabasePermissionRow[]>(event, 'user_permissions', {
    method: 'DELETE',
    prefer: 'return=representation',
    query: {
      select: 'user_id',
      user_id: `eq.${userId}`
    }
  })

  const unique = uniquePermissions(permissions)

  if (!unique.length) {
    return []
  }

  return requestSupabase<SupabasePermissionRow[]>(event, 'user_permissions', {
    body: unique.map(permission => ({
      permission,
      user_id: userId
    })),
    method: 'POST',
    prefer: 'return=representation',
    query: {
      select: 'user_id,permission'
    }
  })
}

async function rollbackCreatedEmployee(event: H3Event, userId: string) {
  await requestSupabase<SupabaseBarberRow[]>(event, 'barbers', {
    method: 'DELETE',
    prefer: 'return=minimal',
    query: {
      id: `eq.${userId}`
    }
  }).catch(() => null)

  await requestSupabase<SupabaseUserRow[]>(event, 'users', {
    method: 'DELETE',
    prefer: 'return=minimal',
    query: {
      id: `eq.${userId}`
    }
  }).catch(() => null)
}

function buildBarberPayload(payload: BarberRegisterPayload | BarberUpdatePayload) {
  const isOperationalBarber = payload.role === 'barber' || payload.role === 'super-barber'

  return {
    branch_id: payload.branch_id,
    is_active: true,
    is_authorized: isOperationalBarber,
    is_on_shift: false,
    name: payload.name,
    photo_url: normalizeNullableText(payload.photo_url),
    phone: normalizeNullableText(payload.phone),
    specialization: normalizeNullableText(payload.specialization)
  }
}

function buildUserResponse(user: SupabaseUserRow | null, permissions: EmployeePermission[]) {
  return user
    ? {
        branch_id: user.branch_id || null,
        id: String(user.id),
        login: user.login || null,
        permissions,
        role: user.role || null
      }
    : null
}

function buildBarberResponse(barber: SupabaseBarberRow | null) {
  return barber
    ? {
        branch_id: barber.branch_id || null,
        id: String(barber.id),
        is_active: barber.is_active ?? null,
        name: barber.name || null,
        photo_url: barber.photo_url || null,
        phone: barber.phone || null,
        specialization: barber.specialization || null
      }
    : null
}

export async function listEmployeeRecords(
  event: H3Event,
  options: {
    branchId?: string | null
  } = {}
) {
  const users = await requestSupabase<SupabaseUserRow[]>(event, 'users', {
    query: {
      ...(options.branchId ? { branch_id: `eq.${options.branchId}` } : {}),
      limit: 500,
      order: 'login.asc.nullslast',
      role: buildRoleFilter(employeeRoles),
      select: 'id,login,role,branch_id'
    }
  })

  const ids = users.map(user => String(user.id))
  const [barbers, permissions] = await Promise.all([
    fetchBarbersByIds(event, ids),
    fetchPermissionsByUserIds(event, ids)
  ])

  const barberMap = new Map(barbers.map(barber => [String(barber.id), barber]))
  const permissionsMap = new Map<string, EmployeePermission[]>()

  for (const row of permissions) {
    const userId = String(row.user_id)
    const permission = normalizeNullableText(row.permission)

    if (!permission || !isEmployeePermission(permission)) {
      continue
    }

    const current = permissionsMap.get(userId) || []
    permissionsMap.set(userId, uniquePermissions([...current, permission]))
  }

  const items: EmployeeDirectoryItem[] = users.map((user) => {
    const userId = String(user.id)
    const profile = barberMap.get(userId) || null

    return {
      branch_id: user.branch_id || profile?.branch_id || null,
      id: userId,
      login: user.login || null,
      name: profile?.name || null,
      permissions: permissionsMap.get(userId) || [],
      photo_url: profile?.photo_url || null,
      phone: profile?.phone || null,
      role: user.role || null,
      specialization: profile?.specialization || null
    }
  })

  return items
}

export async function createBarberRecords(event: H3Event, payload: BarberRegisterPayload) {
  await ensurePermissionsStorage(event)
  await ensureUniqueLogin(event, null, payload.login)

  const password_hash = await hash(payload.password, 10)

  let userRow: SupabaseUserRow | null = null

  try {
    const createdUsers = await requestSupabase<SupabaseUserRow[]>(event, 'users', {
      body: {
        branch_id: payload.branch_id,
        login: payload.login,
        password_hash,
        role: payload.role
      },
      method: 'POST',
      prefer: 'return=representation',
      query: {
        select: 'id,login,role,branch_id'
      }
    })

    userRow = createdUsers[0] || null

    if (!userRow) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось создать пользователя сотрудника.'
      })
    }
  }
  catch (error: any) {
    if (isRoleConstraintError(error)) {
      ensureRoleMigrationApplied(error)
    }

    throw error
  }

  try {
    const createdBarbers = await requestSupabase<SupabaseBarberRow[]>(event, 'barbers', {
      body: {
        id: userRow.id,
        ...buildBarberPayload(payload)
      },
      method: 'POST',
      prefer: 'return=representation',
      query: {
        select: 'id,name,photo_url,phone,specialization,branch_id,is_active'
      }
    })

    await replaceUserPermissions(event, String(userRow.id), payload.permissions)

    return {
      barber: buildBarberResponse(createdBarbers[0] || null),
      user: buildUserResponse(userRow, payload.permissions)
    }
  }
  catch (error) {
    await rollbackCreatedEmployee(event, String(userRow.id))
    throw error
  }
}

export async function updateBarberRecords(event: H3Event, id: string, payload: BarberUpdatePayload) {
  await ensurePermissionsStorage(event)

  const employeeId = requireEmployeeId(id)

  await ensureUniqueLogin(event, employeeId, payload.login)

  const [existingUser, existingBarber] = await Promise.all([
    findUserById(event, employeeId),
    findBarberById(event, employeeId)
  ])

  if (!existingUser || !existingBarber) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Сотрудник для обновления не найден.'
    })
  }

  const userBody: Record<string, unknown> = {
    branch_id: payload.branch_id,
    login: payload.login,
    role: payload.role
  }

  if (payload.password) {
    userBody.password_hash = await hash(payload.password, 10)
  }

  let updatedUsers: SupabaseUserRow[]

  try {
    updatedUsers = await requestSupabase<SupabaseUserRow[]>(event, 'users', {
      body: userBody,
      method: 'PATCH',
      prefer: 'return=representation',
      query: {
        id: `eq.${employeeId}`,
        select: 'id,login,role,branch_id'
      }
    })
  }
  catch (error: any) {
    if (isRoleConstraintError(error)) {
      ensureRoleMigrationApplied(error)
    }

    throw error
  }

  const updatedBarbers = await requestSupabase<SupabaseBarberRow[]>(event, 'barbers', {
    body: buildBarberPayload(payload),
    method: 'PATCH',
    prefer: 'return=representation',
    query: {
      id: `eq.${employeeId}`,
      select: 'id,name,photo_url,phone,specialization,branch_id,is_active'
    }
  })

  await replaceUserPermissions(event, employeeId, payload.permissions)

  return {
    barber: buildBarberResponse(updatedBarbers[0] || null),
    user: buildUserResponse(updatedUsers[0] || null, payload.permissions)
  }
}

export async function deleteBarberRecords(event: H3Event, id: string) {
  const employeeId = requireEmployeeId(id)

  const [existingUser, existingBarber] = await Promise.all([
    findUserById(event, employeeId),
    findBarberById(event, employeeId)
  ])

  if (!existingUser && !existingBarber) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Сотрудник для удаления не найден.'
    })
  }

  await requestSupabase<SupabasePermissionRow[]>(event, 'user_permissions', {
    method: 'DELETE',
    prefer: 'return=minimal',
    query: {
      user_id: `eq.${employeeId}`
    }
  }).catch((error: any) => {
    if (isMissingPermissionsTableError(error)) {
      return null
    }

    throw error
  })

  if (existingBarber) {
    await requestSupabase<SupabaseBarberRow[]>(event, 'barbers', {
      body: {
        is_active: false,
        is_authorized: false,
        is_on_shift: false
      },
      method: 'PATCH',
      prefer: 'return=representation',
      query: {
        id: `eq.${employeeId}`,
        select: 'id'
      }
    })
  }

  if (existingUser) {
    await requestSupabase<SupabaseUserRow[]>(event, 'users', {
      method: 'DELETE',
      prefer: 'return=representation',
      query: {
        id: `eq.${employeeId}`,
        select: 'id'
      }
    })
  }

  return {
    deleted: true
  }
}
