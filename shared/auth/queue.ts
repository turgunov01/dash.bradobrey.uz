import {
  getEffectiveEmployeePermissions,
  type EmployeePermission
} from './employees.ts'

type QueueAccessUser = {
  role?: unknown
  permissions?: unknown
}

function getPermissions(user: QueueAccessUser): Set<EmployeePermission> {
  return new Set(getEffectiveEmployeePermissions(user))
}

export function canReadQueue(user: QueueAccessUser) {
  return getPermissions(user).has('queue.read')
}

export function canManageBranchQueue(user: QueueAccessUser) {
  return getPermissions(user).has('queue.manage.branch')
}
