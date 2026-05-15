import { createError, readBody } from 'h3'
import { z } from 'zod'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

const payloadSchema = z.object({
  category_name: z.string().trim().min(1).optional(),
  duration_minutes: z.union([z.string(), z.number()]).optional().nullable(),
  image: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
  name: z.string().trim().min(1).optional(),
  price: z.union([z.string(), z.number()]).optional().nullable()
}).refine(
  value => Object.keys(value).length > 0,
  { message: 'Нет данных для обновления' }
)

function requireId(value: unknown) {
  const id = String(value || '').trim()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан id услуги.'
    })
  }

  return id
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

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)
  const id = requireId(event.context.params?.id)
  const payload = payloadSchema.parse(await readBody(event))

  if (payload.category_name !== undefined) {
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
          statusMessage: 'Категория не найдена. Сначала создайте категорию и выберите её.'
        })
      }
    }
    catch (error: any) {
      if (isMissingMarketplaceCategoriesTableError(error)) {
        throw createError({
          data: getSupabaseErrorPayload(error),
          statusCode: 501,
          statusMessage: 'В Supabase нет таблицы marketplace_service_categories. Примените SQL-миграцию scripts/supabase/2026-05-15_create_marketplace_service_categories.sql.'
        })
      }

      throw error
    }
  }

  const rows = await supabaseRequest(event, 'marketplace_services', {
    method: 'PATCH',
    prefer: 'return=representation',
    query: {
      id: `eq.${id}`,
      marketplace_barbershop_id: `eq.${access.barbershopId}`,
      select: 'id,marketplace_barbershop_id,name,price,duration_minutes,category_name,image,is_active,created_at,updated_at'
    },
    body: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.price !== undefined ? { price: toNumberOrNull(payload.price) } : {}),
      ...(payload.duration_minutes !== undefined ? { duration_minutes: toIntegerOrNull(payload.duration_minutes) } : {}),
      ...(payload.category_name !== undefined ? { category_name: payload.category_name } : {}),
      ...(payload.image !== undefined ? { image: payload.image || null } : {}),
      ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {})
    }
  })

  const item = Array.isArray(rows) ? rows[0] : null

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Услуга не найдена.'
    })
  }

  return { item }
})
