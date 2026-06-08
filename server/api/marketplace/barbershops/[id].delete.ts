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

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function isMissingRelationError(error: any, relation: string) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '42P01'
    || code === '42703'
    || code === 'PGRST204'
    || code === 'PGRST205'
    || (new RegExp(relation, 'i').test(message) && /does not exist|not found|schema cache/i.test(message))
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

async function detachTable(
  event: Parameters<typeof supabaseRequest>[0],
  table: string,
  barbershopId: string
) {
  try {
    const rows = await supabaseRequest(event, table, {
      body: { marketplace_barbershop_id: null },
      method: 'PATCH',
      prefer: 'return=representation',
      query: {
        marketplace_barbershop_id: `eq.${barbershopId}`,
        select: 'id'
      }
    })

    return Array.isArray(rows) ? rows.length : 0
  }
  catch (error: any) {
    if (isMissingRelationError(error, 'marketplace_barbershop_id')) {
      return 0
    }

    throw error
  }
}

async function deleteScopedTable(
  event: Parameters<typeof supabaseRequest>[0],
  table: string,
  barbershopId: string
) {
  try {
    const rows = await supabaseRequest(event, table, {
      method: 'DELETE',
      prefer: 'return=representation',
      query: {
        marketplace_barbershop_id: `eq.${barbershopId}`,
        select: 'id'
      }
    })

    return Array.isArray(rows) ? rows.length : 0
  }
  catch (error: any) {
    if (isMissingRelationError(error, table)) {
      return 0
    }

    throw error
  }
}

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const barbershopId = requireBarbershopId(event.context.params?.id)

  const existingRows = await supabaseRequest(event, 'marketplace_barbershops', {
    method: 'GET',
    query: {
      id: `eq.${barbershopId}`,
      limit: 1,
      select: 'id,name'
    }
  })
  const existingItem = Array.isArray(existingRows) ? existingRows[0] : null

  if (!existingItem) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Барбершоп не найден.'
    })
  }

  const detachedBranches = await detachTable(event, 'branches', barbershopId)
  const detachedUsers = await detachTable(event, 'users', barbershopId)
  const deletedCategories = await deleteScopedTable(event, 'marketplace_service_categories', barbershopId)
  const deletedServices = await deleteScopedTable(event, 'marketplace_services', barbershopId)
  const deletedBarbers = await deleteScopedTable(event, 'marketplace_barbers', barbershopId)

  let deletedRows: unknown

  try {
    deletedRows = await supabaseRequest(event, 'marketplace_barbershops', {
      method: 'DELETE',
      prefer: 'return=representation',
      query: {
        id: `eq.${barbershopId}`,
        select: 'id,name'
      }
    })
  }
  catch (error: any) {
    const constraint = getForeignKeyConstraintName(error)

    if (constraint) {
      throw createError({
        data: {
          code: 'MARKETPLACE_BARBERSHOP_DELETE_HAS_RELATIONS',
          constraint
        },
        statusCode: 409,
        statusMessage: 'Нельзя удалить барбершоп: остались связанные записи.'
      })
    }

    throw error
  }

  const deletedItem = Array.isArray(deletedRows) ? deletedRows[0] : null

  if (!deletedItem) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Барбершоп уже удалён или не найден.'
    })
  }

  return {
    deleted: true,
    detached: {
      branches: detachedBranches,
      users: detachedUsers
    },
    id: String((deletedItem as any).id),
    item: deletedItem,
    removed: {
      barbers: deletedBarbers,
      categories: deletedCategories,
      services: deletedServices
    }
  }
})
