import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)

  const rows = await supabaseRequest(event, 'branches', {
    method: 'GET',
    query: {
      marketplace_barbershop_id: `eq.${access.barbershopId}`,
      order: 'name.asc.nullslast',
      select: 'id,name,address,city,timezone,work_hours,is_active,marketplace_barbershop_id'
    }
  })

  const items = Array.isArray(rows) ? rows : []

  return {
    items,
    total: items.length
  }
})

