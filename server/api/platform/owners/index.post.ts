import { readBody } from 'h3'

import { pickFields, proxyPlatformBackend } from '~~/server/utils/platform-session'

export default defineEventHandler(async (event) => {
  const body = pickFields(await readBody(event).catch(() => ({})), ['login', 'password'])
  return proxyPlatformBackend(event, '/api/platform/owners', { body, method: 'POST' })
})
