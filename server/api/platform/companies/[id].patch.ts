import { readBody } from 'h3'

import { pickFields, proxyPlatformBackend, requirePlatformCompanyId } from '~~/server/utils/platform-session'

// kiosk_enrollment_code: string = set/rotate, null = clear; never returned.
const UPDATE_FIELDS = ['name', 'code', 'status', 'currency', 'timezone', 'logo_url', 'primary_color', 'kiosk_enrollment_code'] as const

export default defineEventHandler(async (event) => {
  const id = requirePlatformCompanyId(event)
  const body = pickFields(await readBody(event).catch(() => ({})), UPDATE_FIELDS)
  return proxyPlatformBackend(event, `/api/platform/companies/${id}`, { body, method: 'PATCH' })
})
