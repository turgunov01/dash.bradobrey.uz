import { createError, readBody } from 'h3'
import { z } from 'zod'

import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

const payloadSchema = z.object({
  branch_id: z.union([z.string(), z.number()]).transform(value => String(value).trim()),
  is_active: z.boolean().optional().nullable(),
  name: z.string().trim().min(1, 'Введите название категории'),
  sort_order: z.union([z.string(), z.number()]).optional().nullable()
})

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

function isUniqueViolation(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || '').trim()
  return code === '23505'
}

function toIntegerOrNull(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  const num = Number.parseInt(String(value), 10)
  return Number.isFinite(num) ? num : null
}

async function getNextSortOrder(event: any, branchId: string) {
  const rows = await supabaseRequest(event, 'service_categories', {
    method: 'GET',
    query: {
      branch_id: `eq.${branchId}`,
      limit: 1,
      order: 'sort_order.desc.nullslast',
      select: 'sort_order'
    }
  })

  const current = Array.isArray(rows) ? toIntegerOrNull(rows[0]?.sort_order) : null
  return (current ?? 0) + 1
}

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const payload = payloadSchema.parse(await readBody(event))

  if (!payload.branch_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Выберите филиал для категории.'
    })
  }

  try {
    const sortOrder = toIntegerOrNull(payload.sort_order) ?? await getNextSortOrder(event, payload.branch_id)
    const rows = await supabaseRequest(event, 'service_categories', {
      body: {
        branch_id: payload.branch_id,
        is_active: payload.is_active === undefined || payload.is_active === null ? true : Boolean(payload.is_active),
        name: payload.name,
        sort_order: sortOrder
      },
      method: 'POST',
      prefer: 'return=representation',
      query: {
        select: 'id,branch_id,name,sort_order,is_active,created_at,updated_at'
      }
    })

    const item = Array.isArray(rows) ? rows[0] : null

    if (!item) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось создать категорию.'
      })
    }

    return { item }
  }
  catch (error: any) {
    if (isMissingServiceCategoriesTableError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет таблицы service_categories. Примените SQL-миграцию scripts/supabase/2026-05-16_create_service_categories.sql.'
      })
    }

    if (isUniqueViolation(error)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Категория с таким названием уже существует в этом филиале.'
      })
    }

    throw error
  }
})
