import { readBody, setResponseStatus } from 'h3'

import { backendRequest } from '~~/server/utils/backend'
import { pickFields } from '~~/server/utils/platform-session'

// PUT /api/kiosk/enrollment-code { enrollment_code } — company network admins
// rotate their own company's kiosk code. Unlike the public /api/kiosk/* proxy
// this route requires the staff token; the code is never returned.
export default defineEventHandler(async (event) => {
  const response = await backendRequest(event, {
    auth: 'required',
    body: pickFields(await readBody(event).catch(() => ({})), ['enrollment_code']),
    method: 'PUT',
    path: '/api/kiosk/enrollment-code'
  })
  setResponseStatus(event, response.status)
  return response.data
})
