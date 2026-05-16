import { createError, getQuery } from 'h3'

import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function isMissingServiceCategoriesTableError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (/service_categories/i.test(message) && /does not exist|not found|schema cache/i.test(message))
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

function requireBranchId(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  const branchId = String(raw || '').trim()

  if (!branchId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Выберите филиал для категорий услуг.'
    })
  }

  return branchId
}

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const query = getQuery(event)
  const branchId = requireBranchId((query as any).branch_id ?? (query as any).object_id)
  const includeInactive = isTruthy((query as any).include_inactive ?? (query as any).includeInactive)

  try {
    const rows = await supabaseRequest(event, 'service_categories', {
      method: 'GET',
      query: {
        branch_id: `eq.${branchId}`,
        ...(includeInactive ? {} : { is_active: 'eq.true' }),
        order: 'sort_order.asc.nullslast,name.asc.nullslast',
        select: 'id,branch_id,name,sort_order,is_active,created_at,updated_at'
      }
    })

    const items = Array.isArray(rows) ? rows : []

    return {
      items,
      total: items.length
    }
  }
  catch (error: any) {
    if (isMissingServiceCategoriesTableError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет таблицы service_categories. Примените SQL-миграцию scripts/supabase/2026-05-16_create_service_categories.sql.'
      })
    }

    throw error
  }
})
