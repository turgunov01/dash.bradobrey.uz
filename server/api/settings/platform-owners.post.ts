import { readBody, setResponseStatus } from 'h3'

import { backendRequest } from '~~/server/utils/backend'
import { pickFields } from '~~/server/utils/platform-session'

export default defineEventHandler(async (event) => {
  const response = await backendRequest(event, {
    auth: 'required',
    body: pickFields(await readBody(event).catch(() => ({})), ['login', 'password']),
    method: 'POST',
    path: '/api/platform/owners'
  })
  setResponseStatus(event, response.status)
  return response.data
})
