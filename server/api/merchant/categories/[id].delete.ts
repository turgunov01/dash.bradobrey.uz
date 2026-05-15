import { createError } from 'h3'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

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

function isMissingMarketplaceServicesTableError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (/marketplace_services/i.test(message) && /does not exist|not found|schema cache/i.test(message))
}

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)
  const id = requireId(event.context.params?.id)

  try {
    const existing = await supabaseRequest(event, 'marketplace_service_categories', {
      method: 'GET',
      query: {
        id: `eq.${id}`,
        marketplace_barbershop_id: `eq.${access.barbershopId}`,
        select: 'id,name'
      }
    })

    const category = Array.isArray(existing) ? existing[0] : null

    if (!category) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Категория не найдена.'
      })
    }

    const categoryName = String((category as any).name || '').trim()

    if (categoryName) {
      try {
        const services = await supabaseRequest(event, 'marketplace_services', {
          method: 'GET',
          query: {
            marketplace_barbershop_id: `eq.${access.barbershopId}`,
            category_name: `eq.${categoryName}`,
            select: 'id',
            limit: 1
          }
        })

        if (Array.isArray(services) && services.length) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Нельзя удалить категорию: в ней есть услуги. Сначала перенесите/удалите услуги.'
          })
        }
      }
      catch (error: any) {
        if (!isMissingMarketplaceServicesTableError(error)) {
          throw error
        }
      }
    }

    const rows = await supabaseRequest(event, 'marketplace_service_categories', {
      method: 'DELETE',
      prefer: 'return=representation',
      query: {
        id: `eq.${id}`,
        marketplace_barbershop_id: `eq.${access.barbershopId}`,
        select: 'id'
      }
    })

    const item = Array.isArray(rows) ? rows[0] : null

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Категория не найдена.'
      })
    }

    return {
      deleted: true,
      id: String((item as any).id)
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
})

