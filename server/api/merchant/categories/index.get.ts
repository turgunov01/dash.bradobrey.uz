import { createError, getQuery } from 'h3'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function isMissingMarketplaceCategoriesTableError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (/marketplace_service_categories/i.test(message) && /does not exist|not found|schema cache/i.test(message))
}

function isMissingSortOrderColumnError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return (code === '42703' || code === 'PGRST204')
    && /sort_order/i.test(message)
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
    const rows = await supabaseRequest(event, 'marketplace_service_categories', {
      method: 'GET',
      query: {
        marketplace_barbershop_id: `eq.${access.barbershopId}`,
        ...(includeInactive ? {} : { is_active: 'eq.true' }),
        order: 'sort_order.asc.nullslast,name.asc.nullslast',
        select: 'id,marketplace_barbershop_id,name,sort_order,is_active,created_at,updated_at'
      }
    })

    const items = Array.isArray(rows) ? rows : []

    return {
      items,
      total: items.length
    }
  }
  catch (error: any) {
    if (isMissingMarketplaceCategoriesTableError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет таблицы marketplace_service_categories. Примените SQL-миграцию scripts/supabase/2026-05-15_create_marketplace_service_categories.sql.'
      })
    }

    if (isMissingSortOrderColumnError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет поля sort_order для marketplace_service_categories. Примените SQL-миграцию scripts/supabase/2026-05-16_add_sort_order_to_marketplace_service_categories.sql.'
      })
    }

    throw error
  }
})
