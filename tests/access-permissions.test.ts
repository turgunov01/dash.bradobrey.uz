import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  employeePermissionDefinitions,
  employeePermissions,
  employeePermissionSections,
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

test('gives admin accounts full dashboard access when backend returns empty permissions', () => {
  assert.deepEqual(
    getEffectiveEmployeePermissions({ permissions: [], role: 'admin' }),
    employeeRolePermissionPresets.admin
  )
  assert.deepEqual(
    getEffectiveEmployeePermissions({ permissions: [], role: 'admin_network' }),
    employeeRolePermissionPresets.admin
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

test('assigns quality review only to intended management presets', () => {
  assert.equal(employeePermissions.includes('statistics.quality.review'), true)
  assert.equal(employeePermissionDefinitions['statistics.quality.review'].label, 'Проверка качества заказов')
  assert.equal(
    employeePermissionSections.some(section => section.items.includes('statistics.quality.review')),
    true
  )
  assert.equal(employeeRolePermissionPresets.admin.includes('statistics.quality.review'), true)
  assert.equal(employeeRolePermissionPresets.manager.includes('statistics.quality.review'), true)
  assert.equal(employeeRolePermissionPresets['super-manager'].includes('statistics.quality.review'), true)
  assert.equal(employeeRolePermissionPresets.barber.includes('statistics.quality.review'), false)
  assert.equal(employeeRolePermissionPresets['super-barber'].includes('statistics.quality.review'), false)
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
  assert.deepEqual(requiredForPath('/statistics/branch'), ['statistics.read.branch', 'statistics.read.global'])
  assert.equal(canAccessPath(new Set(employeeRolePermissionPresets.barber), '/statistics/branch'), false)
  assert.equal(canAccessPath(new Set(employeeRolePermissionPresets.manager), '/statistics/branch'), true)
})
