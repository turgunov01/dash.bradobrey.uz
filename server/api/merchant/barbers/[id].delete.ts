import { createError } from 'h3'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

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

  const rows = await supabaseRequest(event, 'marketplace_barbers', {
    method: 'DELETE',
    prefer: 'return=representation',
    query: {
      id: `eq.${id}`,
      marketplace_barbershop_id: `eq.${access.barbershopId}`,
      select: 'id'
    }
  })

  const item = Array.isArray(rows) ? rows[0] : null

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Барбер не найден.'
    })
  }

  return {
    deleted: true,
    id: String(item.id)
  }
})
