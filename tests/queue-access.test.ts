import { test } from 'node:test'
import assert from 'node:assert/strict'

import { canManageBranchQueue, canReadQueue } from '../shared/auth/queue.ts'

test('allows managers to read and manage the branch queue', () => {
  const user = { role: 'manager' }

  assert.equal(canReadQueue(user), true)
  assert.equal(canManageBranchQueue(user), true)
})

test('allows barbers to read their queue without branch management access', () => {
  const user = { role: 'barber' }

  assert.equal(canReadQueue(user), true)
  assert.equal(canManageBranchQueue(user), false)
})

test('uses explicit permissions when they are present', () => {
  assert.equal(canReadQueue({ role: 'barber', permissions: ['queue.read', 'queue.manage.branch'] }), true)
  assert.equal(canManageBranchQueue({ role: 'barber', permissions: ['queue.read', 'queue.manage.branch'] }), true)
  assert.equal(canReadQueue({ role: 'manager', permissions: [] }), false)
})

test('denies queue access to users without queue permissions', () => {
  assert.equal(canReadQueue({ role: 'merchant' }), false)
  assert.equal(canManageBranchQueue({ role: 'merchant' }), false)
})
