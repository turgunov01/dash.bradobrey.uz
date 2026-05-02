import { createError, getHeader, getQuery, setResponseStatus } from 'h3'

import { backendRequest } from '~~/server/utils/backend'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const authHeader = getHeader(event, 'authorization') || ''

  const response = await backendRequest(event, {
    auth: authHeader ? 'none' : 'required',
    headers: authHeader ? { Authorization: authHeader } : undefined,
    method: 'GET',
    path: '/api/loyalty/ranks/settings',
    query: getQuery(event)
  })

  if (!response) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Пустой ответ от бэкенда.'
    })
  }

  setResponseStatus(event, response.status)
  return response.data
})

