import { createError, readBody } from 'h3'
import { z } from 'zod'

import { marketplaceMerchantRoles } from '~~/shared/auth/employees'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

const merchantRoleFilter = `in.(${marketplaceMerchantRoles.map(role => `"${role}"`).join(',')})`

const payloadSchema = z.object({
  id: z.union([z.string(), z.number()])
    .transform(value => String(value).trim())
    .refine(value => Boolean(value), 'Укажите id аккаунта мерчанта.')
    .optional()
}).default({})

function requireBarbershopId(value: unknown) {
  const id = String(value || '').trim()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан id барбершопа.'
    })
  }

  return id
}

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const barbershopId = requireBarbershopId(event.context.params?.id)
  const body = await readBody(event).catch(() => undefined)
  const payload = payloadSchema.parse(body ?? undefined)

  const rows = await supabaseRequest(event, 'users', {
    method: 'GET',
    query: {
      ...(payload.id ? { id: `eq.${payload.id}` } : {}),
      marketplace_barbershop_id: `eq.${barbershopId}`,
      role: merchantRoleFilter,
      limit: 2,
      select: 'id,login,role,marketplace_barbershop_id'
    }
  })

  const items = Array.isArray(rows) ? rows : []

  if (!items.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Аккаунт мерчанта не найден.'
    })
  }

  if (!payload.id && items.length > 1) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Найдено несколько аккаунтов мерчанта. Укажите id аккаунта для удаления.'
    })
  }

  const item = items[0]

  const deletedRows = await supabaseRequest(event, 'users', {
    method: 'DELETE',
    prefer: 'return=representation',
    query: {
      id: `eq.${item.id}`,
      marketplace_barbershop_id: `eq.${barbershopId}`,
      role: merchantRoleFilter,
      select: 'id,login,role,marketplace_barbershop_id'
    }
  })

  const deletedItem = Array.isArray(deletedRows) ? deletedRows[0] : null

  if (!deletedItem) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Аккаунт мерчанта уже удалён или не найден.'
    })
  }

  return {
    deleted: true,
    id: String(deletedItem.id),
    item: deletedItem
  }
})
