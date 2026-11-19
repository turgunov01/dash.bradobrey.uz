import { readBody, setResponseStatus } from 'h3'

import { backendRequest } from '~~/server/utils/backend'
import { pickFields, requirePlatformCompanyId } from '~~/server/utils/platform-session'

// First admin of a franchise. The API refuses the main company itself for
// non-owners (403 DEFAULT_COMPANY_ADMIN_FORBIDDEN).
export default defineEventHandler(async (event) => {
  const id = requirePlatformCompanyId(event)
  const response = await backendRequest(event, {
    auth: 'required',
    body: pickFields(await readBody(event).catch(() => ({})), ['login', 'password']),
    method: 'POST',
    path: `/api/platform/companies/${id}/admins`
  })
  setResponseStatus(event, response.status)
  return response.data
})
