import { createError, type H3Event } from 'h3'

import { assertDashboardAccessUser, getCurrentBackendAccessUser } from './admin-access'
import { clearAdminSession, getAdminSession } from './admin-session'
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
      statusMessage: 'Для мерчанта не назначен `marketplace_barbershop_id`.'
    })
  }

  return barbershopId
}

export async function ensureMerchantAccess(event: H3Event): Promise<MerchantAccess> {
  const adminSession = getAdminSession(event)
  let accessUser: any

  if (adminSession) {
    try {
      accessUser = adminSession.role
        ? assertDashboardAccessUser(adminSession)
        : await getCurrentBackendAccessUser(event)
    }
    catch (error) {
      clearAdminSession(event)
      throw error
    }
  }
  else {
    try {
      accessUser = await getCurrentBackendAccessUser(event)
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
