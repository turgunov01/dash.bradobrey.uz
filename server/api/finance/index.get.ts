import { createError, getQuery } from 'h3'

import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

function getCurrentPeriodKey() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function normalizePeriodKey(value: unknown) {
  const text = String(value || '').trim()

  if (/^\d{4}-\d{2}$/.test(text)) {
    const [, month] = text.split('-')

    if (Number(month) >= 1 && Number(month) <= 12) {
      return text
    }
  }

  return getCurrentPeriodKey()
}

function isMissingFinanceTableError(error: any) {
  const payload = error?.data || error?.response?._data
  const code = String(payload?.code || error?.code || '').trim()
  const message = [
    payload?.message,
    payload?.details,
    error?.message
  ].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (
      /finance_snapshots/i.test(message)
      && /does not exist|not found|schema cache/i.test(message)
    )
}

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const query = getQuery(event)
  const branchId = query.branch_id ?? query.object_id
  const period = normalizePeriodKey(query.period)
  const normalizedBranchId = branchId ? String(branchId).trim() : ''

  if (!normalizedBranchId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан филиал (branch_id).'
    })
  }

  try {
    const rows = await supabaseRequest(event, 'finance_snapshots', {
      method: 'GET',
      query: {
        branch_id: `eq.${normalizedBranchId}`,
        limit: 1,
        period: `eq.${period}`,
        select: 'branch_id,period,payload,updated_at'
      }
    })

    const row = Array.isArray(rows) ? rows[0] : null

    return {
      branch_id: normalizedBranchId,
      payload: row?.payload ?? null,
      period,
      updated_at: row?.updated_at ?? null
    }
  }
  catch (error: any) {
    if (isMissingFinanceTableError(error)) {
      throw createError({
        data: error?.data || null,
        statusCode: 501,
        statusMessage: 'В Supabase нет таблицы finance_snapshots. Создайте её и повторите.'
      })
    }

    throw error
  }
})

