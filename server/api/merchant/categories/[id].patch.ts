import { createError, readBody } from 'h3'
import { z } from 'zod'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

const payloadSchema = z.object({
  is_active: z.boolean().optional().nullable(),
  name: z.string().trim().min(1).optional(),
  sort_order: z.union([z.string(), z.number()]).optional().nullable()
}).refine(
  value => Object.keys(value).length > 0,
  { message: 'Нет данных для обновления' }
)

function requireId(value: unknown) {
  const id = String(value || '').trim()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан id категории.'
    })
  }

  return id
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

function isMissingSortOrderColumnError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return (code === '42703' || code === 'PGRST204')
    && /sort_order/i.test(message)
}

function isMissingMarketplaceServicesTableError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (/marketplace_services/i.test(message) && /does not exist|not found|schema cache/i.test(message))
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

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)
  const id = requireId(event.context.params?.id)
  const payload = payloadSchema.parse(await readBody(event))
  const sortOrder = payload.sort_order === undefined ? undefined : toIntegerOrNull(payload.sort_order)

  try {
    const existing = await supabaseRequest(event, 'marketplace_service_categories', {
      method: 'GET',
      query: {
        id: `eq.${id}`,
        marketplace_barbershop_id: `eq.${access.barbershopId}`,
        select: 'id,name'
      }
    })

    const existingItem = Array.isArray(existing) ? existing[0] : null

    if (!existingItem) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Категория не найдена.'
      })
    }

    const previousName = String((existingItem as any).name || '').trim()

    const rows = await supabaseRequest(event, 'marketplace_service_categories', {
      method: 'PATCH',
      prefer: 'return=representation',
      query: {
        id: `eq.${id}`,
        marketplace_barbershop_id: `eq.${access.barbershopId}`,
        select: 'id,marketplace_barbershop_id,name,sort_order,is_active,created_at,updated_at'
      },
      body: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
        ...(sortOrder !== undefined && sortOrder !== null ? { sort_order: sortOrder } : {})
      }
    })

    const item = Array.isArray(rows) ? rows[0] : null

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Категория не найдена.'
      })
    }

    const nextName = String((item as any).name || '').trim()

    if (payload.name !== undefined && previousName && nextName && previousName !== nextName) {
      try {
        await supabaseRequest(event, 'marketplace_services', {
          method: 'PATCH',
          prefer: 'return=minimal',
          query: {
            marketplace_barbershop_id: `eq.${access.barbershopId}`,
            category_name: `eq.${previousName}`
          },
          body: {
            category_name: nextName
          }
        })
      }
      catch (error: any) {
        if (!isMissingMarketplaceServicesTableError(error)) {
          throw error
        }
      }
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

    if (isMissingSortOrderColumnError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет поля sort_order для marketplace_service_categories. Примените SQL-миграцию scripts/supabase/2026-05-16_add_sort_order_to_marketplace_service_categories.sql.'
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
