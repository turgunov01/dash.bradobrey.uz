import { proxyBackend } from '~~/server/utils/backend'

export default defineEventHandler(async (event): Promise<unknown> => {
  const slug = event.context.params?.slug || ''
  const path = `/api/barbers/${slug}`
  // Every employee route, including register, requires an admin token upstream.
  return proxyBackend<unknown>(event, path, 'required')
})
