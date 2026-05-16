import { getMethod, getQuery, setResponseStatus } from 'h3'

import { backendRequest, proxyBackend } from '~~/server/utils/backend'
import { isServiceMultipartRequest, readServiceMultipartProxyBody } from '~~/server/utils/service-form'

export default defineEventHandler(async (event): Promise<unknown> => {
  if (isServiceMultipartRequest(event)) {
    const response = await backendRequest<unknown>(event, {
      auth: 'none',
      body: await readServiceMultipartProxyBody(event),
      method: getMethod(event),
      path: '/api/services',
      query: getQuery(event)
    })

    setResponseStatus(event, response.status)

    return response.data
  }

  return proxyBackend<unknown>(event, '/api/services', 'none')
})
