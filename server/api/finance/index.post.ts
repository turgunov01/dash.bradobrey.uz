import { createError, readBody } from 'h3'

import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

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

function normalizePeriodKey(value: unknown) {
  const text = String(value || '').trim()

  if (!/^\d{4}-\d{2}$/.test(text)) {
    return null
  }

  const [, month] = text.split('-')

  if (Number(month) < 1 || Number(month) > 12) {
    return null
  }

  return text
}

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const body = await readBody(event)
  const branchId = body?.branch_id
  const period = normalizePeriodKey(body?.period)
  const payload = body?.payload ?? {}

  const normalizedBranchId = branchId ? String(branchId).trim() : ''

  if (!normalizedBranchId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан филиал (branch_id).'
    })
  }

  if (!period) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан период (period) в формате YYYY-MM.'
    })
  }

  try {
    const rows = await supabaseRequest(event, 'finance_snapshots', {
      body: {
        branch_id: normalizedBranchId,
        payload,
        period,
        updated_at: new Date().toISOString()
      },
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      query: {
        on_conflict: 'branch_id,period',
        select: 'branch_id,period,payload,updated_at'
      }
    })

    const row = Array.isArray(rows) ? rows[0] : null

    if (!row) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Не удалось сохранить финансы в Supabase.'
      })
    }

    return {
      branch_id: row.branch_id ?? normalizedBranchId,
      payload: row.payload ?? payload,
      period: row.period ?? period,
      updated_at: row.updated_at ?? null
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

