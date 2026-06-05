import { createError, type H3Event } from 'h3'

import { ensureAdminNetworkAccess } from './admin-access'
import { clearAdminSession, getAdminSession } from './admin-session'
import { backendRequest } from './backend'
import { clearBarberToken } from './session'

function assertNotMerchant(accessUser: { role?: unknown }) {
  const role = String(accessUser?.role || '').trim().toLowerCase()

  if (role === 'merchant' || role === 'partner') {
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
      return assertNotMerchant(adminSession)
    }

    try {
      const accessUser = await ensureAdminNetworkAccess(event, adminSession)
      return assertNotMerchant(accessUser)
    }
    catch (error) {
      clearAdminSession(event)
      throw error
    }
  }

  try {
    const response = await backendRequest<{ user?: Record<string, any> | null }>(event, {
      auth: 'required',
      method: 'GET',
      path: '/api/barbers/me'
    })

    const accessUser = await ensureAdminNetworkAccess(event, {
      id: response.data?.user?.id,
      login: response.data?.user?.login
    })

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
