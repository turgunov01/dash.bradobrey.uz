import { readBody, setResponseStatus } from 'h3'

import { backendRequest } from '~~/server/utils/backend'
import { pickFields, requirePlatformCompanyId } from '~~/server/utils/platform-session'

// kiosk_enrollment_code: string = set/rotate, null = clear; never returned.
const UPDATE_FIELDS = ['name', 'code', 'status', 'currency', 'timezone', 'logo_url', 'primary_color', 'kiosk_enrollment_code'] as const

export default defineEventHandler(async (event) => {
  const id = requirePlatformCompanyId(event)
  const response = await backendRequest(event, {
    auth: 'required',
    body: pickFields(await readBody(event).catch(() => ({})), UPDATE_FIELDS),
    method: 'PATCH',
    path: `/api/platform/companies/${id}`
  })
  setResponseStatus(event, response.status)
  return response.data
})
