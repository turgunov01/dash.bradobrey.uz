import { readBody } from 'h3'

import { pickFields, proxyPlatformBackend, requirePlatformCompanyId } from '~~/server/utils/platform-session'

export default defineEventHandler(async (event) => {
  const id = requirePlatformCompanyId(event)
  const body = pickFields(await readBody(event).catch(() => ({})), ['login', 'password'])
  return proxyPlatformBackend(event, `/api/platform/companies/${id}/admins`, { body, method: 'POST' })
})
