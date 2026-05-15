import { createError, readBody } from 'h3'
import { z } from 'zod'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

const payloadSchema = z.object({
  is_active: z.boolean().optional().nullable(),
  name: z.string().trim().min(1, 'Введите название категории')
})

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

function isUniqueViolation(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || '').trim()
  return code === '23505'
}

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)
  const payload = payloadSchema.parse(await readBody(event))

  try {
    const rows = await supabaseRequest(event, 'marketplace_service_categories', {
      method: 'POST',
      prefer: 'return=representation',
      query: {
        select: 'id,marketplace_barbershop_id,name,is_active,created_at,updated_at'
      },
      body: {
        marketplace_barbershop_id: access.barbershopId,
        name: payload.name,
        is_active: payload.is_active === undefined || payload.is_active === null ? true : Boolean(payload.is_active)
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
    if (isMissingMarketplaceCategoriesTableError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет таблицы marketplace_service_categories. Примените SQL-миграцию scripts/supabase/2026-05-15_create_marketplace_service_categories.sql.'
      })
    }

    if (isUniqueViolation(error)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Категория с таким названием уже существует.'
      })
    }

    throw error
  }
})

