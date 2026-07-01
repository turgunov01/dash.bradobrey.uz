import { getQuery, getRequestURL, setResponseStatus } from 'h3'

import { backendRequest, readIncomingBody } from '~~/server/utils/backend'

export default defineEventHandler(async (event) => {
  const response = await backendRequest<unknown>(event, {
    auth: 'required',
    body: await readIncomingBody(event),
    method: 'DELETE',
    path: getRequestURL(event).pathname,
    query: {
      ...getQuery(event),
      force: true
    }
  })

  setResponseStatus(event, response.status)

  return response.data
})
