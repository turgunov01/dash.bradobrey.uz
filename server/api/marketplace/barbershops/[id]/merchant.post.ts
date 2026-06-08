import { hash } from 'bcryptjs'
import { createError, readBody } from 'h3'
import { z } from 'zod'

import { marketplaceMerchantRoles } from '~~/shared/auth/employees'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

const payloadSchema = z.object({
  login: z.string().trim().min(3),
  password: z.string().min(6)
})
const merchantAccountRole = 'admin_branch'
const merchantRoleFilter = `in.(${marketplaceMerchantRoles.map(role => `"${role}"`).join(',')})`

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
      role: merchantRoleFilter,
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

  const createMerchantUser = async () => {
    const rows = await supabaseRequest(event, 'users', {
      body: {
        login: payload.login,
        marketplace_barbershop_id: barbershopId,
        password_hash: passwordHash,
        role: merchantAccountRole
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
    const item = await createMerchantUser()
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
        statusMessage: 'В Supabase users_role_check не принимает роль admin_branch. Обновите check constraint и повторите.',
        data: payload
      })
    }

    throw error
  }
})
