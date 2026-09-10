import { getRouterParam } from 'h3'
import { proxyBackend } from '~~/server/utils/backend'

export default defineEventHandler(event => {
  const slug = getRouterParam(event, 'slug') || ''
  return proxyBackend<unknown>(event, `/api/penalties/${slug}`, 'required')
})
