import { proxyBackend } from '~~/server/utils/backend'

export default defineEventHandler((event): Promise<unknown> => {
  const slug = event.context.params?.slug || ''

  return proxyBackend<unknown>(event, `/api/verifix/${slug}`, 'required')
})
