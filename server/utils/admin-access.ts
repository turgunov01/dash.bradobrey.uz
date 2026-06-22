import { createError, type H3Event } from 'h3'
import { z } from 'zod'

import { operationalBarberRoles } from '~~/shared/auth/employees'

import { backendRequest } from './backend'

const identifierSchema = z.union([z.string(), z.number()]).transform(value => String(value))
const optionalIdentifierSchema = identifierSchema.optional().nullable()
const optionalTextSchema = z.string().trim().optional().nullable()

const accessUserSchema = z.object({
  branch_id: optionalIdentifierSchema,
  id: identifierSchema,
  login: optionalTextSchema,
  marketplace_barbershop_id: optionalIdentifierSchema,
  marketplaceBarbershopId: optionalIdentifierSchema,
  name: optionalTextSchema,
  phone: optionalTextSchema,
  role: optionalTextSchema
}).passthrough()

export type AccessUser = z.infer<typeof accessUserSchema>

function parseBackendAccessUser(rawUser: unknown): AccessUser | null {
  const parsed = accessUserSchema.safeParse(rawUser)
  return parsed.success ? parsed.data : null
}

function requireAccessUser(accessUser: AccessUser | null) {
  if (!accessUser) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Для доступа к панели требуется пользователь backend API.'
    })
  }

  return accessUser
}

export function assertAdminNetworkRole(accessUser: AccessUser) {
  const role = String(accessUser.role || '').trim()

  if (!role || (operationalBarberRoles as readonly string[]).includes(role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Доступ в админку запрещён для барберов.'
    })
  }

  return accessUser
}

export function assertDashboardAccessUser(rawUser: unknown) {
  return assertAdminNetworkRole(requireAccessUser(parseBackendAccessUser(rawUser)))
}

export async function getCurrentBackendAccessUser(event: H3Event) {
  const response = await backendRequest<{ user?: Record<string, any> | null }>(event, {
    auth: 'required',
    method: 'GET',
    path: '/api/barbers/me'
  })

  return assertDashboardAccessUser(response.data?.user)
}

export function toDashboardUser(accessUser: AccessUser) {
  const login = accessUser.login ? String(accessUser.login).trim() : null
  const marketplaceBarbershopId = accessUser.marketplace_barbershop_id ?? accessUser.marketplaceBarbershopId ?? null

  return {
    branch_id: accessUser.branch_id ?? null,
    id: String(accessUser.id),
    login,
    marketplace_barbershop_id: marketplaceBarbershopId,
    name: accessUser.name || login || 'Администратор',
    phone: accessUser.phone ?? null,
    role: accessUser.role || null
  }
}
