import { proxyBackend } from '~~/server/utils/backend'

export default defineEventHandler(async (event): Promise<unknown> => {
  const id = event.context.params?.id || ''

  return proxyBackend<unknown>(event, `/api/marketplace/catalog/barbershops/${id}/branches`, 'optional')
})

