import { operationalBarberRoles } from '~~/shared/auth/employees'
import { listSupabaseUsers } from '~~/server/utils/admin-access'
import { listEmployeeRecords } from '~~/server/utils/barber-admin'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const { branch_id, mode } = getQuery(event)
  const branchId = branch_id ? String(branch_id) : null
  const directoryMode = String(mode || '').trim().toLowerCase()

  if (directoryMode === 'employees') {
    const items = await listEmployeeRecords(event, { branchId })

    return {
      items: items.map(item => ({
        branch_id: item.branch_id || null,
        id: String(item.id),
        login: item.login || null,
        name: item.name || null,
        permissions: item.permissions || [],
        photo_url: item.photo_url || null,
        phone: item.phone || null,
        role: item.role || null,
        specialization: item.specialization || null
      })),
      total: items.length
    }
  }

  const items = await listSupabaseUsers(event, {
    branchId,
    roles: [...operationalBarberRoles]
  })

  return {
    items: items.map(item => ({
      branch_id: item.branch_id || null,
      id: String(item.id),
      login: item.login || null,
      phone: item.phone || null,
      role: item.role || null
    })),
    total: items.length
  }
})
