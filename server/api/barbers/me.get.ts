import { setResponseStatus } from 'h3'

import { clearAdminBackendToken, clearAdminSession, getAdminSession, setAdminSession } from '~~/server/utils/admin-session'
import { assertDashboardAccessUser, getCurrentBackendAccessUser, toDashboardUser } from '~~/server/utils/admin-access'
import { backendRequest } from '~~/server/utils/backend'
import { clearBarberToken } from '~~/server/utils/session'

export default defineEventHandler(async (event): Promise<unknown> => {
  const adminSession = getAdminSession(event)

  if (adminSession) {
    try {
      const accessUser = await getCurrentBackendAccessUser(event)
      const user = toDashboardUser(accessUser)

      setAdminSession(event, {
        branch_id: user.branch_id,
        id: user.id,
        login: user.login || adminSession.login,
        marketplace_barbershop_id: user.marketplace_barbershop_id,
        permissions: user.permissions,
        role: user.role
      })

      return {
        barber: null,
        user
      }
    }
    catch (error) {
      clearAdminSession(event)
      clearAdminBackendToken(event)
      throw error
    }
  }

  try {
    const response = await backendRequest<{ barber?: Record<string, any> | null, user?: Record<string, any> | null }>(event, {
      auth: 'required',
      method: 'GET',
      path: '/api/barbers/me'
    })
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
    if ([401, 403].includes(error?.statusCode || error?.response?.status)) {
      clearAdminSession(event)
      clearAdminBackendToken(event)
      clearBarberToken(event)
    }

    throw error
  }
})
