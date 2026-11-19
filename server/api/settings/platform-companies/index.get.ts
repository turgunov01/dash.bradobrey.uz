import { setResponseStatus } from 'h3'

import { backendRequest } from '~~/server/utils/backend'

// Main company's network admins manage franchise companies with their own
// company token (MULTI_TENANCY 12). The backend decides who may (403 for
// everyone else); the platform-owner cookie is never used here.
export default defineEventHandler(async (event) => {
  const response = await backendRequest(event, { auth: 'required', method: 'GET', path: '/api/platform/companies' })
  setResponseStatus(event, response.status)
  return response.data
})
