import { proxyBackend } from '~~/server/utils/backend'

export default defineEventHandler(async (event): Promise<unknown> => {
  const slug = event.context.params?.slug || ''
  const auth = slug.startsWith('barber') ? 'required' : 'optional'

  return proxyBackend<unknown>(event, `/api/history/${slug}`, auth)
})
