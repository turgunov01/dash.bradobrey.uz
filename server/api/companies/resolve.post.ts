import { readBody, setResponseStatus } from 'h3'

import { backendRequest } from '~~/server/utils/backend'
import { pickFields } from '~~/server/utils/platform-session'

// Public company-code lookup (used by the local dashboard; production calls
// the API directly so the per-IP rate limit applies to the user's IP).
export default defineEventHandler(async (event) => {
  const response = await backendRequest(event, {
    auth: 'none',
    body: pickFields(await readBody(event).catch(() => ({})), ['code']),
    method: 'POST',
    path: '/api/companies/resolve'
  })
  setResponseStatus(event, response.status)
  return response.data
})
