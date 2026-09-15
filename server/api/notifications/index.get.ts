import { proxyBackend } from '~~/server/utils/backend'
export default defineEventHandler(async (event) => proxyBackend<unknown>(event, '/api/notifications', 'required'))
