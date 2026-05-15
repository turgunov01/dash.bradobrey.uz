import { createError, readBody } from 'h3'
import { z } from 'zod'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

const payloadSchema = z.object({
  category_name: z.string().trim().min(1, 'Выберите категорию'),
  duration_minutes: z.union([z.string(), z.number()]).optional().nullable(),
  image: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
  name: z.string().trim().min(1, 'Введите название услуги'),
  price: z.union([z.string(), z.number()]).optional().nullable()
})

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function isMissingMarketplaceServicesTableError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (/marketplace_services/i.test(message) && /does not exist|not found|schema cache/i.test(message))
}

function isMissingMarketplaceCategoriesTableError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (/marketplace_service_categories/i.test(message) && /does not exist|not found|schema cache/i.test(message))
}

function toNumberOrNull(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function toIntegerOrNull(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  const num = Number.parseInt(String(value), 10)
  return Number.isFinite(num) ? num : null
}

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)
  const payload = payloadSchema.parse(await readBody(event))

  try {
    const categories = await supabaseRequest(event, 'marketplace_service_categories', {
      method: 'GET',
      query: {
        marketplace_barbershop_id: `eq.${access.barbershopId}`,
        name: `eq.${payload.category_name}`,
        select: 'id',
        limit: 1
      }
    })

    if (!Array.isArray(categories) || categories.length === 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Сначала создайте категорию и выберите её.'
      })
    }

    const rows = await supabaseRequest(event, 'marketplace_services', {
      method: 'POST',
      prefer: 'return=representation',
      query: {
        select: 'id,marketplace_barbershop_id,name,price,duration_minutes,category_name,image,is_active,created_at,updated_at'
      },
      body: {
        marketplace_barbershop_id: access.barbershopId,
        name: payload.name,
        price: toNumberOrNull(payload.price),
        duration_minutes: toIntegerOrNull(payload.duration_minutes),
        category_name: payload.category_name,
        image: payload.image || null,
        is_active: payload.is_active === undefined || payload.is_active === null ? true : Boolean(payload.is_active)
      }
    })

    const item = Array.isArray(rows) ? rows[0] : null

    if (!item) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось создать услугу.'
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

    if (isMissingMarketplaceServicesTableError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет таблицы marketplace_services. Примените SQL-миграцию scripts/supabase/2026-05-12_create_marketplace_barbers_and_services.sql.'
      })
    }

    throw error
  }
})
