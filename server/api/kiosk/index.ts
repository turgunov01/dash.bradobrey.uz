import { proxyBackend } from '~~/server/utils/backend'

export default defineEventHandler(async (event): Promise<unknown> => {
  // Forward the employee token (see [...slug].ts).
  return proxyBackend<unknown>(event, '/api/kiosk/', 'optional')
})
