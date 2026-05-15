import { createError } from 'h3'

import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

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

  const rows = await supabaseRequest(event, 'users', {
    method: 'GET',
    query: {
      marketplace_barbershop_id: `eq.${barbershopId}`,
      role: 'in.("merchant","partner")',
      order: 'login.asc.nullslast',
      select: 'id,login,role,marketplace_barbershop_id'
    }
  })

  const items = Array.isArray(rows) ? rows : []

  return {
    items,
    total: items.length
  }
})
