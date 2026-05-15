import { createError, getQuery } from 'h3'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function isMissingMarketplaceServicesTableError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (/marketplace_services/i.test(message) && /does not exist|not found|schema cache/i.test(message))
}

function isTruthy(value: unknown) {
  if (Array.isArray(value)) {
    return isTruthy(value[0])
  }

  if (value === true) {
    return true
  }

  const text = String(value ?? '').trim().toLowerCase()
  return text === '1' || text === 'true' || text === 'yes' || text === 'on'
}

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)
  const query = getQuery(event)
  const includeInactive = isTruthy((query as any).include_inactive ?? (query as any).includeInactive)

  try {
    const rows = await supabaseRequest(event, 'marketplace_services', {
      method: 'GET',
      query: {
        marketplace_barbershop_id: `eq.${access.barbershopId}`,
        ...(includeInactive ? {} : { is_active: 'eq.true' }),
        order: 'name.asc.nullslast',
        select: 'id,marketplace_barbershop_id,name,price,duration_minutes,category_name,image,is_active,created_at,updated_at'
      }
    })

    const items = Array.isArray(rows) ? rows : []

    return {
      items,
      total: items.length
    }
  }
  catch (error: any) {
    if (isMissingMarketplaceServicesTableError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет таблицы marketplace_services. Примените SQL-миграцию scripts/supabase/2026-05-12_create_marketplace_barbers_and_services.sql.'
      })
    }

    throw error
  }
})
