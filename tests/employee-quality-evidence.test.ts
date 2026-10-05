import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  sanitizeEmployeeQualityEvidenceResponse,
  validateEmployeeQualityEvidenceQuery
} from '../shared/statistics/employee-quality-evidence.ts'

const binding = {
  branch_id: 'b1',
  category: 'suspicious' as const,
  employee_id: 'e1',
  end_date: '2026-10-31',
  scope: 'branch' as const,
  start_date: '2026-10-01'
}

function response() {
  return {
    category: 'suspicious',
    formula_version: 'employee-quality-v1',
    orders: [{
      actual_minutes: 20,
      assessment_source: 'live_snapshot',
      branch_id: 'b1',
      classification: 'suspicious',
      client_phone: '+998-secret',
      completed_at: '2026-10-10T10:00:00+05:00',
      data_confidence: 'authoritative',
      employee_id: 'e1',
      expected_minutes: 60,
      occurred_at: '2026-10-10T10:00:00+05:00',
      order_id: 'o1',
      reason_code: 'duration_below_threshold',
      review_state: 'unreviewed',
      rule_code: 'duration_ratio',
      rule_version: 'employee-quality-v1',
      status: 'completed'
    }],
    pagination: { cursor: null, limit: 50, next_cursor: null, total: 1 },
    range: { start_date: '2026-10-01', end_date: '2026-10-31' },
    scope: { type: 'branch', branch_id: 'b1', employee_id: 'e1' },
    timezone: 'Asia/Tashkent'
  }
}

test('validates canonical evidence query categories and review states', () => {
  assert.deepEqual(validateEmployeeQualityEvidenceQuery('suspicious', 'confirmed', null, '50'), {
    category: 'suspicious',
    review_state: 'confirmed',
    limit: 50
  })
  assert.throws(() => validateEmployeeQualityEvidenceQuery('cancelled', null, null, null))
  assert.throws(() => validateEmployeeQualityEvidenceQuery('suspicious', 'invalid', null, null))
  assert.throws(
    () => validateEmployeeQualityEvidenceQuery('employee_failure', 'confirmed', null, null),
    /only for suspicious/
  )
})

test('sanitizes evidence PII and binds every order to employee and branch', () => {
  const result = sanitizeEmployeeQualityEvidenceResponse(response(), binding)
  assert.equal((result.orders[0] as unknown as Record<string, unknown>).client_phone, undefined)
  assert.equal(result.orders[0]!.order_id, 'o1')
  assert.equal(result.pagination.limit, 50)

  const paged = response()
  paged.pagination.cursor = 'page-2'
  assert.equal(
    sanitizeEmployeeQualityEvidenceResponse(paged, { ...binding, cursor: 'page-2', limit: 50 }).pagination.cursor,
    'page-2'
  )
  assert.throws(
    () => sanitizeEmployeeQualityEvidenceResponse(paged, { ...binding, cursor: 'other-page', limit: 50 }),
    /cursor is not bound/
  )

  const outOfScope = response()
  outOfScope.orders[0]!.branch_id = 'b2'
  assert.throws(() => sanitizeEmployeeQualityEvidenceResponse(outOfScope, binding), /outside the requested scope/)

  const wrongCategory = response()
  wrongCategory.orders[0]!.classification = 'employee_failure'
  assert.throws(() => sanitizeEmployeeQualityEvidenceResponse(wrongCategory, binding), /outside the requested category/)

  const duplicate = response()
  duplicate.orders.push({ ...duplicate.orders[0]! })
  duplicate.pagination.total = 2
  assert.throws(() => sanitizeEmployeeQualityEvidenceResponse(duplicate, binding), /duplicate order id/)
})
