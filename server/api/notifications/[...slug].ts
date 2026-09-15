import { getRouterParam } from 'h3'
import { proxyBackend } from '~~/server/utils/backend'
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  return proxyBackend<unknown>(event, `/api/notifications/${slug}`, 'required')
})
