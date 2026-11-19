import { setResponseStatus } from 'h3'

import { backendRequest } from '~~/server/utils/backend'

// Default company's network admins manage platform-owner accounts with their
// own company token. The backend decides who may (403 for everyone else).
export default defineEventHandler(async (event) => {
  const response = await backendRequest(event, { auth: 'required', method: 'GET', path: '/api/platform/owners' })
  setResponseStatus(event, response.status)
  return response.data
})
