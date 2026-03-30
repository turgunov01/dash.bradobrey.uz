import { createError } from 'h3'
import { updateBarberRecords } from '~~/server/utils/barber-admin'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { readEmployeeUpdatePayload } from '~~/server/utils/employee-form'

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const id = String(event.context.params?.id || '').trim()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан идентификатор сотрудника.'
    })
  }

  const payload = await readEmployeeUpdatePayload(event)

  return updateBarberRecords(event, id, payload)
})
