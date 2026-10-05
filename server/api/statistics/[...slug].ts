import { proxyBackend } from '~~/server/utils/backend'

export default defineEventHandler(async (event): Promise<unknown> => {
  const slug = event.context.params?.slug || ''

  return proxyBackend<unknown>(event, `/api/statistics/${slug}`, 'required')
})
