import { setResponseStatus } from 'h3'

import { setAdminBackendToken } from '~~/server/utils/admin-session'
import { backendRequest, readIncomingBody } from '~~/server/utils/backend'

export default defineEventHandler(async (event): Promise<unknown> => {
  const response = await backendRequest<{ token?: string }>(event, {
    auth: 'required',
    body: await readIncomingBody(event),
    method: 'POST',
    path: '/api/barbers/me/branch'
  })

  if (response.data?.token) {
    setAdminBackendToken(event, response.data.token)
  }

  setResponseStatus(event, response.status)
  return response.data
})
