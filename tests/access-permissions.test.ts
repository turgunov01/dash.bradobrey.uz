import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  employeeRolePermissionPresets,
  getEffectiveEmployeePermissions
} from '../shared/auth/employees.ts'
import {
  canAccessPath,
  requiredForPath
} from '../app/utils/access.ts'

test('uses explicit permissions and removes invalid or duplicate values', () => {
  assert.deepEqual(
    getEffectiveEmployeePermissions({
      permissions: ['employees.read', 'employees.read', 'not-a-permission'],
      role: 'admin'
    }),
    ['employees.read']
  )
  assert.deepEqual(
    getEffectiveEmployeePermissions({ permissions: ['not-a-permission'], role: 'admin' }),
    []
  )
})

test('uses role presets only when the backend does not provide an override', () => {
  assert.deepEqual(
    getEffectiveEmployeePermissions({ role: 'manager' }),
    employeeRolePermissionPresets.manager
  )
  assert.deepEqual(
    getEffectiveEmployeePermissions({ permissions: [], role: 'manager' }),
    []
  )
})

test('maps legacy dashboard roles to compatible permission presets', () => {
  assert.deepEqual(
    getEffectiveEmployeePermissions({ role: 'admin_network' }),
    employeeRolePermissionPresets.admin
  )
  assert.deepEqual(
    getEffectiveEmployeePermissions({ role: 'admin_branch' }),
    employeeRolePermissionPresets.manager
  )
})

test('protects marketplace aliases and their original settings routes', () => {
  const noDashboardAccess = new Set(employeeRolePermissionPresets.barber)
  const dashboardAccess = new Set(employeeRolePermissionPresets.manager)

  for (const path of [
    '/dashboard/marketplace/loyalty-ranks',
    '/dashboard/marketplace/cashback',
    '/settings/loyalty-ranks',
    '/settings/cashback'
  ]) {
    assert.ok(requiredForPath(path))
    assert.equal(canAccessPath(noDashboardAccess, path), false)
    assert.equal(canAccessPath(dashboardAccess, path), true)
  }
})

test('uses the most specific route policy and denies self-only access to the global dashboard', () => {
  assert.deepEqual(requiredForPath('/warehouse/expenses'), ['expenses.read'])
  assert.deepEqual(requiredForPath('/barbers/workspace'), ['queue.read'])
  assert.equal(
    canAccessPath(new Set(employeeRolePermissionPresets.barber), '/'),
    false
  )
})
