import { createError, type H3Event } from 'h3'

import { getCurrentBackendAccessUser } from './admin-access'
import { clearAdminBackendToken, clearAdminSession, getAdminSession } from './admin-session'
import { clearBarberToken } from './session'

function assertNotMerchant(accessUser: { marketplaceBarbershopId?: unknown, marketplace_barbershop_id?: unknown, role?: unknown }) {
  const role = String(accessUser?.role || '').trim().toLowerCase()
  const barbershopId = String(accessUser?.marketplace_barbershop_id ?? accessUser?.marketplaceBarbershopId ?? '').trim()

  if (barbershopId || role === 'merchant' || role === 'partner') {
    throw createError({
      statusCode: 403,
      message: 'Доступ в админ-панель запрещён для мерчантов.'
    })
  }

  return accessUser
}

export async function ensureDashboardAccess(event: H3Event) {
  const adminSession = getAdminSession(event)

  if (adminSession) {
    try {
      const accessUser = await getCurrentBackendAccessUser(event)
      return assertNotMerchant(accessUser)
    }
    catch (error) {
      clearAdminSession(event)
      clearAdminBackendToken(event)
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
