import { readBody } from 'h3'

import { pickFields, proxyPlatformBackend } from '~~/server/utils/platform-session'

const CREATE_FIELDS = ['name', 'code', 'currency', 'timezone', 'logo_url', 'primary_color'] as const

export default defineEventHandler(async (event) => {
  const body = pickFields(await readBody(event).catch(() => ({})), CREATE_FIELDS)
  return proxyPlatformBackend(event, '/api/platform/companies', { body, method: 'POST' })
})
