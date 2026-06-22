import { proxyBackendCurrentPath } from '~~/server/utils/backend'

export default defineEventHandler(event => proxyBackendCurrentPath<unknown>(event, 'optional'))
