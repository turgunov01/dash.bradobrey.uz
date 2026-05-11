import { createError, readBody } from 'h3'

import { branchFormSchema } from '~~/shared/schemas'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const payload = branchFormSchema.parse(await readBody(event))

  const rows = await supabaseRequest(event, 'branches', {
    body: payload,
    method: 'POST',
    prefer: 'return=representation',
    query: {
      select: 'id,name,address,city,timezone,work_hours,is_active,marketplace_barbershop_id'
    }
  })

  const item = Array.isArray(rows) ? rows[0] : null

  if (!item) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось создать филиал.'
    })
  }

  return { item }
})
