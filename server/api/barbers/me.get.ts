import { setResponseStatus } from 'h3'

import { clearAdminBackendToken, clearAdminSession, getAdminSession } from '~~/server/utils/admin-session'
import { assertDashboardAccessUser, getCurrentBackendAccessUser, toDashboardUser } from '~~/server/utils/admin-access'
import { backendRequest } from '~~/server/utils/backend'
import { clearBarberToken } from '~~/server/utils/session'

export default defineEventHandler(async (event): Promise<unknown> => {
  const adminSession = getAdminSession(event)

  if (adminSession) {
    if (adminSession.role) {
      const accessUser = assertDashboardAccessUser(adminSession)

      return {
        barber: null,
        user: toDashboardUser(accessUser)
      }
    }

    try {
      const accessUser = await getCurrentBackendAccessUser(event)

      return {
        barber: null,
        user: toDashboardUser(accessUser)
      }
    }
    catch (error) {
      clearAdminSession(event)
      clearAdminBackendToken(event)
      throw error
    }
  }

  const response = await backendRequest<{ barber?: Record<string, any> | null, user?: Record<string, any> | null }>(event, {
    auth: 'required',
    method: 'GET',
    path: '/api/barbers/me'
  })

  try {
    const accessUser = assertDashboardAccessUser(response.data?.user)

    setResponseStatus(event, response.status)

    return {
      ...response.data,
      user: response.data?.user
        ? {
            ...response.data.user,
            ...(accessUser?.role ? { role: accessUser.role } : {})
          }
        : null
    }
  }
  catch (error: any) {
    if ((error?.statusCode || error?.response?.status) === 403) {
      clearAdminSession(event)
      clearAdminBackendToken(event)
      clearBarberToken(event)
    }

    throw error
  }
})
