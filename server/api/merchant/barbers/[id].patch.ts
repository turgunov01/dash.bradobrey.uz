import { createError, readBody } from 'h3'
import { z } from 'zod'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

const payloadSchema = z.object({
  branch_id: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional().nullable(),
  photo_url: z.string().trim().optional().nullable(),
  specialization: z.string().trim().optional().nullable()
}).refine(
  value => Object.keys(value).length > 0,
  { message: 'Нет данных для обновления' }
)

function requireId(value: unknown) {
  const id = String(value || '').trim()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан id барбера.'
    })
  }

  return id
}

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)
  const id = requireId(event.context.params?.id)
  const payload = payloadSchema.parse(await readBody(event))

  const rows = await supabaseRequest(event, 'marketplace_barbers', {
    method: 'PATCH',
    prefer: 'return=representation',
    query: {
      id: `eq.${id}`,
      marketplace_barbershop_id: `eq.${access.barbershopId}`,
      select: 'id,marketplace_barbershop_id,branch_id,name,phone,specialization,photo_url,is_active,created_at,updated_at'
    },
    body: {
      ...(payload.branch_id !== undefined ? { branch_id: payload.branch_id || null } : {}),
      ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone || null } : {}),
      ...(payload.specialization !== undefined ? { specialization: payload.specialization || null } : {}),
      ...(payload.photo_url !== undefined ? { photo_url: payload.photo_url || null } : {})
    }
  })

  const item = Array.isArray(rows) ? rows[0] : null

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Барбер не найден.'
    })
  }

  return { item }
})
