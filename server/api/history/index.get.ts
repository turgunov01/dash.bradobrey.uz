import { proxyBackend } from '~~/server/utils/backend'

export default defineEventHandler(async (event): Promise<unknown> => {
  return proxyBackend<unknown>(event, '/api/history', 'optional')
})
