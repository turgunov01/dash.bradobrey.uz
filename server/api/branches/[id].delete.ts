import { createError, getQuery } from 'h3'

import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function isTruthy(value: unknown) {
  if (Array.isArray(value)) {
    return isTruthy(value[0])
  }

  if (value === true) {
    return true
  }

  if (value === undefined || value === null) {
    return false
  }

  const text = String(value).trim().toLowerCase()

  return text === '1' || text === 'true' || text === 'yes' || text === 'on'
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
      statusMessage: 'РќРµ СѓРєР°Р·Р°РЅ id С„РёР»РёР°Р»Р°.'
    })
  }

  return id
}

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const branchId = requireBranchId(event.context.params?.id)
  const query = getQuery(event)
  const force = isTruthy((query as any).force ?? (query as any).cascade)

  async function deleteBranch() {
    return await supabaseRequest(event, 'branches', {
      method: 'DELETE',
      prefer: 'return=representation',
      query: {
        id: `eq.${branchId}`,
        select: 'id'
      }
    })
  }

  let rows: unknown

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      rows = await deleteBranch()
      break
    }
    catch (error: any) {
      const constraint = getForeignKeyConstraintName(error)

      if (!constraint) {
        throw error
      }

      if (constraint === 'queue_entries_branch_id_fkey') {
        if (!force) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Нельзя удалить филиал: есть связанные записи очереди. Очистите очередь филиала или сделайте филиал неактивным.',
            data: {
              code: 'BRANCH_DELETE_HAS_QUEUE_ENTRIES',
              constraint
            }
          })
        }

        await supabaseRequest(event, 'queue_entries', {
          method: 'DELETE',
          prefer: 'return=minimal',
          query: {
            branch_id: `eq.${branchId}`
          }
        })

        continue
      }

      if (constraint === 'users_branch_id_fkey') {
        if (!force) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Нельзя удалить филиал: есть сотрудники, привязанные к филиалу. Переназначьте им филиал или сделайте филиал неактивным.',
            data: {
              code: 'BRANCH_DELETE_HAS_USERS',
              constraint
            }
          })
        }

        await supabaseRequest(event, 'users', {
          body: { branch_id: null },
          method: 'PATCH',
          prefer: 'return=minimal',
          query: {
            branch_id: `eq.${branchId}`
          }
        })

        continue
      }

      if (constraint === 'barbers_branch_id_fkey') {
        if (!force) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Нельзя удалить филиал: есть мастера, привязанные к филиалу. Переназначьте им филиал или сделайте филиал неактивным.',
            data: {
              code: 'BRANCH_DELETE_HAS_BARBERS',
              constraint
            }
          })
        }

        await supabaseRequest(event, 'barbers', {
          body: { branch_id: null },
          method: 'PATCH',
          prefer: 'return=minimal',
          query: {
            branch_id: `eq.${branchId}`
          }
        })

        continue
      }

      throw error
    }
  }

  const item = Array.isArray(rows) ? rows[0] : null

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Р¤РёР»РёР°Р» РЅРµ РЅР°Р№РґРµРЅ.'
    })
  }

  return {
    deleted: true,
    id: String(item.id)
  }
})
