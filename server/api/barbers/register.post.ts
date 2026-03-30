import { createBarberRecords } from '~~/server/utils/barber-admin'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { readEmployeeRegisterPayload } from '~~/server/utils/employee-form'

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const payload = await readEmployeeRegisterPayload(event)

  return createBarberRecords(event, payload)
})
