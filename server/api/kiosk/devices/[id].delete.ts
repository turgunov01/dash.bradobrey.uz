import { proxyBackendCurrentPath } from '~~/server/utils/backend'

// Removing a kiosk frees its device name so the device can register again.
export default defineEventHandler(event => proxyBackendCurrentPath<unknown>(event, 'required'))
