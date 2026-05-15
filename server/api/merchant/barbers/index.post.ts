import { createError, readBody } from 'h3'
import { z } from 'zod'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { supabaseRequest } from '~~/server/utils/supabase'

const payloadSchema = z.object({
  branch_id: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
  name: z.string().trim().min(1, 'Введите имя барбера'),
  phone: z.string().trim().optional().nullable(),
  photo_url: z.string().trim().optional().nullable(),
  specialization: z.string().trim().optional().nullable()
})

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function isMissingMarketplaceBarbersTableError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (/marketplace_barbers/i.test(message) && /does not exist|not found|schema cache/i.test(message))
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
  const payload = payloadSchema.parse(await readBody(event))

  try {
    const services = await supabaseRequest(event, 'marketplace_services', {
      method: 'GET',
      query: {
        marketplace_barbershop_id: `eq.${access.barbershopId}`,
        select: 'id',
        limit: 1
      }
    })

    if (!Array.isArray(services) || services.length === 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Сначала создайте хотя бы одну услугу.'
      })
    }

    const rows = await supabaseRequest(event, 'marketplace_barbers', {
      method: 'POST',
      prefer: 'return=representation',
      query: {
        select: 'id,marketplace_barbershop_id,branch_id,name,phone,specialization,photo_url,is_active,created_at,updated_at'
      },
      body: {
        marketplace_barbershop_id: access.barbershopId,
        branch_id: payload.branch_id || null,
        is_active: payload.is_active === undefined || payload.is_active === null ? true : Boolean(payload.is_active),
        name: payload.name,
        phone: payload.phone || null,
        specialization: payload.specialization || null,
        photo_url: payload.photo_url || null
      }
    })

    const item = Array.isArray(rows) ? rows[0] : null

    if (!item) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось создать барбера.'
      })
    }

    return { item }
  }
  catch (error: any) {
    if (isMissingMarketplaceBarbersTableError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет таблицы marketplace_barbers. Примените SQL-миграцию scripts/supabase/2026-05-12_create_marketplace_barbers_and_services.sql.'
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
