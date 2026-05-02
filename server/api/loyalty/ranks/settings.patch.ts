import { getHeader, getMethod, getQuery, setResponseStatus } from 'h3'

import { backendRequest, readIncomingBody } from '~~/server/utils/backend'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const authHeader = getHeader(event, 'authorization') || ''

  const response = await backendRequest(event, {
    auth: authHeader ? 'none' : 'required',
    body: await readIncomingBody(event),
    headers: authHeader ? { Authorization: authHeader } : undefined,
    method: getMethod(event),
    path: '/api/loyalty/ranks/settings',
    query: getQuery(event)
  })

  setResponseStatus(event, response.status)
  return response.data
})

