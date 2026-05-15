import { hash } from 'bcryptjs'
import { createError, readBody } from 'h3'
import { z } from 'zod'

import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

const payloadSchema = z.object({
  login: z.string().trim().min(3),
  password: z.string().min(6)
})

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

function isRoleConstraintError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '23514' || /users_role_check|check constraint|role/i.test(message)
}

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const barbershopId = requireBarbershopId(event.context.params?.id)
  const payload = payloadSchema.parse(await readBody(event))

  const existing = await supabaseRequest(event, 'users', {
    method: 'GET',
    query: {
      marketplace_barbershop_id: `eq.${barbershopId}`,
      role: 'in.("merchant","partner")',
      limit: 1,
      select: 'id'
    }
  })

  if (Array.isArray(existing) && existing[0]) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Для этого барбершопа уже создан аккаунт мерчанта.'
    })
  }

  const passwordHash = await hash(payload.password, 10)

  const createMerchantUser = async (role: 'merchant' | 'partner') => {
    const rows = await supabaseRequest(event, 'users', {
      body: {
        login: payload.login,
        marketplace_barbershop_id: barbershopId,
        password_hash: passwordHash,
        role
      },
      method: 'POST',
      prefer: 'return=representation',
      query: {
        select: 'id,login,role,marketplace_barbershop_id'
      }
    })

    const item = Array.isArray(rows) ? rows[0] : null

    if (!item) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось создать мерчанта.'
      })
    }

    return item
  }

  try {
    let item: any

    try {
      item = await createMerchantUser('merchant')
    }
    catch (error: any) {
      if (!isRoleConstraintError(error)) {
        throw error
      }

      item = await createMerchantUser('partner')
    }

    return { item }
  }
  catch (error: any) {
    const payload = getSupabaseErrorPayload(error)
    const code = String(payload?.code || error?.code || '').trim()

    if (code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Логин уже занят. Укажите другой логин.',
        data: payload
      })
    }

    if (code === '42703' || code === 'PGRST204') {
      throw createError({
        statusCode: 501,
        statusMessage: 'В таблице users нет колонки marketplace_barbershop_id. Добавьте её в Supabase и повторите.',
        data: payload
      })
    }

    if (isRoleConstraintError(error)) {
      throw createError({
        statusCode: 501,
        statusMessage: 'В Supabase не обновлён users_role_check для ролей merchant/partner. Добавьте эти роли в check constraint и повторите.',
        data: payload
      })
    }

    throw error
  }
})
