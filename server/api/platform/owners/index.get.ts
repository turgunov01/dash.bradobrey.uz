import { proxyPlatformBackend } from '~~/server/utils/platform-session'

export default defineEventHandler(event => proxyPlatformBackend(event, '/api/platform/owners', { method: 'GET' }))
