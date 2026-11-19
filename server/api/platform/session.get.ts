import { createError } from 'h3'

import { getPlatformSession } from '~~/server/utils/platform-session'

// Current platform-owner session from the signed cookie (no backend call; the
// token itself is checked by the backend on every /api/platform/* request).
export default defineEventHandler((event) => {
  const user = getPlatformSession(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Требуется вход владельца платформы.' })
  }

  return { user }
})
