import { createError } from 'h3'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function getForeignKeyConstraintName(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || '').trim()
  const message = [
    payload?.message,
    payload?.details,
    error?.message
  ].filter(Boolean).join(' ')

  if (code !== '23503') {
    return null
  }

  const patterns = [
    /foreign key constraint "([^"]+)"/i,
    /foreign key constraint '([^']+)'/i,
    /constraint "([^"]+)"/i,
    /constraint '([^']+)'/i
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

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
  const access = await ensureMerchantAccess(event)
  const branchId = requireBranchId(event.context.params?.id)

  let rows: unknown

  try {
    rows = await supabaseRequest(event, 'branches', {
      method: 'DELETE',
      prefer: 'return=representation',
      query: {
        id: `eq.${branchId}`,
        marketplace_barbershop_id: `eq.${access.barbershopId}`,
        select: 'id'
      }
    })
  }
  catch (error: any) {
    const constraint = getForeignKeyConstraintName(error)

    if (constraint === 'queue_entries_branch_id_fkey') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Нельзя удалить филиал: есть связанные записи очереди. Очистите очередь филиала или сделайте филиал неактивным.',
        data: { code: 'BRANCH_DELETE_HAS_QUEUE_ENTRIES', constraint }
      })
    }

    if (constraint === 'users_branch_id_fkey') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Нельзя удалить филиал: есть сотрудники, привязанные к филиалу. Переназначьте им филиал или сделайте филиал неактивным.',
        data: { code: 'BRANCH_DELETE_HAS_USERS', constraint }
      })
    }

    if (constraint === 'barbers_branch_id_fkey' || constraint === 'marketplace_barbers_branch_id_fkey') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Нельзя удалить филиал: есть барберы, привязанные к филиалу. Переназначьте им филиал или сделайте филиал неактивным.',
        data: { code: 'BRANCH_DELETE_HAS_BARBERS', constraint }
      })
    }

    throw error
  }

  const item = Array.isArray(rows) ? rows[0] : null

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Филиал не найден.'
    })
  }

  return {
    deleted: true,
    id: String((item as any).id)
  }
})

