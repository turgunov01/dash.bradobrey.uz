import { proxyBackendCurrentPath } from '~~/server/utils/backend'

// Registered kiosk devices (staff-only on the API, unlike the open kiosk routes).
export default defineEventHandler(event => proxyBackendCurrentPath<unknown>(event, 'required'))
