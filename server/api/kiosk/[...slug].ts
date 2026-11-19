import { proxyBackend } from '~~/server/utils/backend'

export default defineEventHandler(async (event): Promise<unknown> => {
  const slug = event.context.params?.slug || ''

  // Forward the signed-in employee's token: with KIOSK_AUTH_ENFORCE the API
  // rejects anonymous /api/kiosk/* calls and accepts a DB-verified staff token
  // scoped to the employee's branches.
  return proxyBackend<unknown>(event, `/api/kiosk/${slug}`, 'optional')
})
