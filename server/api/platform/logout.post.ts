import { clearPlatformSession } from '~~/server/utils/platform-session'

// The backend has no platform logout: dropping the cookies ends the session.
export default defineEventHandler((event) => {
  clearPlatformSession(event)
  return { success: true }
})
