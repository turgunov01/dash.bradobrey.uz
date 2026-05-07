import { createError } from 'h3'

import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function isMissingBranchesTableError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [
    payload?.message,
    payload?.details,
    error?.message
  ].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (
      /branches/i.test(message)
      && /does not exist|not found|schema cache/i.test(message)
    )
}

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  try {
    const rows = await supabaseRequest(event, 'branches', {
      method: 'GET',
      query: {
        order: 'name.asc.nullslast',
        select: 'id,name,address,city,timezone,work_hours,is_active'
      }
    })

    const items = Array.isArray(rows) ? rows : []

    return {
      items,
      total: items.length
    }
  }
  catch (error: any) {
    if (isMissingBranchesTableError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет таблицы branches. Создайте её и повторите.'
      })
    }

    throw error
  }
})
