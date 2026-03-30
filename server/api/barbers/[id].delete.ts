import { createError, setResponseStatus } from 'h3'

import { deleteBarberRecords } from '~~/server/utils/barber-admin'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const id = String(event.context.params?.id || '').trim()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан идентификатор сотрудника.'
    })
  }

  const response = await deleteBarberRecords(event, id)

  setResponseStatus(event, 200)

  return response
})
