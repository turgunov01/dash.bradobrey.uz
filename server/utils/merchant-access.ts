import { createError, type H3Event } from 'h3'

import { ensureAdminNetworkAccess } from './admin-access'
import { clearAdminSession, getAdminSession } from './admin-session'
import { backendRequest } from './backend'
import { clearBarberToken } from './session'

type MerchantAccess = {
  barbershopId: string
  user: Record<string, any>
}

function requireBarbershopId(user: Record<string, any>) {
  const value = user?.marketplace_barbershop_id ?? user?.marketplaceBarbershopId ?? null
  const barbershopId = String(value || '').trim()

  if (!barbershopId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Для мерчанта не назначен `marketplace_barbershop_id` в таблице users Supabase.'
    })
  }

  return barbershopId
}

export async function ensureMerchantAccess(event: H3Event): Promise<MerchantAccess> {
  const adminSession = getAdminSession(event)
  let accessUser: any

  if (adminSession) {
    try {
      accessUser = await ensureAdminNetworkAccess(event, adminSession)
    }
    catch (error) {
      clearAdminSession(event)
      throw error
    }
  }
  else {
    try {
      const response = await backendRequest<{ user?: Record<string, any> | null }>(event, {
        auth: 'required',
        method: 'GET',
        path: '/api/barbers/me'
      })

      accessUser = await ensureAdminNetworkAccess(event, {
        id: response.data?.user?.id,
        login: response.data?.user?.login
      })
    }
    catch (error: any) {
      if ((error?.statusCode || error?.response?.status) === 403) {
        clearAdminSession(event)
        clearBarberToken(event)
      }

      throw error
    }
  }

  return {
    barbershopId: requireBarbershopId(accessUser),
    user: accessUser
  }
}
