import { createError, readBody } from 'h3'

import { branchUpdateSchema } from '~~/shared/schemas'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
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

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const branchId = requireBranchId(event.context.params?.id)
  const payload = branchUpdateSchema.parse(await readBody(event))

  const rows = await supabaseRequest(event, 'branches', {
    body: payload,
    method: 'PATCH',
    prefer: 'return=representation',
    query: {
      id: `eq.${branchId}`,
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
