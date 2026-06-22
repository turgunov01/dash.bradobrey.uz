import { createError, type H3Event } from 'h3'

import { assertDashboardAccessUser, getCurrentBackendAccessUser } from './admin-access'
import { clearAdminSession, getAdminSession } from './admin-session'
import { clearBarberToken } from './session'

function assertNotMerchant(accessUser: { marketplaceBarbershopId?: unknown, marketplace_barbershop_id?: unknown, role?: unknown }) {
  const role = String(accessUser?.role || '').trim().toLowerCase()
  const barbershopId = String(accessUser?.marketplace_barbershop_id ?? accessUser?.marketplaceBarbershopId ?? '').trim()

  if (barbershopId || role === 'merchant' || role === 'partner') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Доступ в админ-панель запрещён для мерчантов.'
    })
  }

  return accessUser
}

export async function ensureDashboardAccess(event: H3Event) {
  const adminSession = getAdminSession(event)

  if (adminSession) {
    if (adminSession.role) {
      return assertNotMerchant(assertDashboardAccessUser(adminSession))
    }

    try {
      const accessUser = await getCurrentBackendAccessUser(event)
      return assertNotMerchant(accessUser)
    }
    catch (error) {
      clearAdminSession(event)
      throw error
    }
  }

  try {
    const accessUser = await getCurrentBackendAccessUser(event)
    return assertNotMerchant(accessUser)
  }
  catch (error: any) {
    if ((error?.statusCode || error?.response?.status) === 403) {
      clearAdminSession(event)
      clearBarberToken(event)
    }

    throw error
  }
}
