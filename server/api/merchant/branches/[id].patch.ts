import { createError, readBody } from 'h3'

import { branchUpdateSchema } from '~~/shared/schemas'
import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

function requireBranchId(value: unknown) {
  const id = String(value || '').trim()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан id филиала.'
    })
  }

  return id
}

const payloadSchema = branchUpdateSchema.refine(
  value => Object.keys(value).length > 0,
  { message: 'Нет данных для обновления' }
)

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)
  const branchId = requireBranchId(event.context.params?.id)
  const parsed = payloadSchema.parse(await readBody(event))

  const { marketplace_barbershop_id: _ignoredMarketplaceId, ...payload } = parsed as Record<string, any>

  const rows = await supabaseRequest(event, 'branches', {
    body: payload,
    method: 'PATCH',
    prefer: 'return=representation',
    query: {
      id: `eq.${branchId}`,
      marketplace_barbershop_id: `eq.${access.barbershopId}`,
      select: 'id,name,address,city,timezone,work_hours,is_active,marketplace_barbershop_id'
    }
  })

  const item = Array.isArray(rows) ? rows[0] : null

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Филиал не найден.'
    })
  }

  return { item }
})
