import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  sanitizeEmployeeQualityReviewRequest,
  sanitizeEmployeeQualityReviewResponse,
  toEmployeeQualityReviewApiRequest
} from '../shared/statistics/employee-quality-review.ts'

const employeeId = '11111111-1111-4111-8111-111111111111'
const orderId = '22222222-2222-4222-8222-222222222222'
const branchId = '33333333-3333-4333-8333-333333333333'
const reviewerId = '44444444-4444-4444-8444-444444444444'

const binding = {
  branch_id: branchId,
  decision: 'confirmed' as const,
  employee_id: employeeId,
  expected_version: 3,
  order_id: orderId,
  reason: 'Проверено по журналу времени',
  reviewer_id: reviewerId,
  scope: 'branch' as const
}

function apiResponseFixture() {
  return {
    assessment: {
      branch_id: branchId,
      employee_id: employeeId,
      order_id: orderId,
      review_state: 'confirmed',
      review_version: 4,
      reviewed_at: '2026-10-04T12:00:00+05:00',
      reviewed_by: reviewerId,
      suspicious: true
    },
    idempotent: false
  }
}

test('translates the Dashboard review DTO to the canonical API request', () => {
  const dashboardRequest = sanitizeEmployeeQualityReviewRequest({
    actor_type: 'system',
    decision: 'confirmed',
    expected_version: 3,
    idempotency_key: 'review:o1:3',
    reason: ' Проверено по журналу времени ',
    reviewer_id: 'spoofed-reviewer'
  })

  assert.deepEqual(dashboardRequest, {
    decision: 'confirmed',
    expected_version: 3,
    idempotency_key: 'review:o1:3',
    reason: 'Проверено по журналу времени'
  })
  assert.deepEqual(toEmployeeQualityReviewApiRequest(dashboardRequest), {
    expected_version: 3,
    idempotency_key: 'review:o1:3',
    review_comment: 'Проверено по журналу времени',
    review_state: 'confirmed'
  })
})

test('rejects unsupported decisions and non-canonical idempotency keys', () => {
  const base = { expected_version: 3, idempotency_key: 'review:o1:3', reason: 'reason' }
  assert.throws(() => sanitizeEmployeeQualityReviewRequest({ ...base, decision: 'reopen' }), /confirmed or dismissed/)
  assert.throws(() => sanitizeEmployeeQualityReviewRequest({ ...base, decision: 'confirmed', idempotency_key: 'short' }), /8-100/)
  assert.throws(() => sanitizeEmployeeQualityReviewRequest({ ...base, decision: 'confirmed', idempotency_key: 'unsafe key!' }), /8-100/)
})

test('adapts and exactly binds the canonical { assessment, idempotent } API response', () => {
  const result = sanitizeEmployeeQualityReviewResponse(apiResponseFixture(), binding)

  assert.deepEqual(result, {
    assessment: {
      branch_id: branchId,
      employee_id: employeeId,
      order_id: orderId,
      review_state: 'confirmed',
      reviewed_at: '2026-10-04T12:00:00+05:00',
      reviewer_id: reviewerId,
      version: 4
    },
    idempotent: false
  })

  const replay = apiResponseFixture() as ReturnType<typeof apiResponseFixture> & {
    assessment: ReturnType<typeof apiResponseFixture>['assessment'] & {
      expected_version: number
      requested_review_state: string
      resulting_version: number
      review_comment: string
    }
  }
  replay.idempotent = true
  replay.assessment.review_state = 'dismissed'
  replay.assessment.review_version = 5
  replay.assessment.reviewed_by = '55555555-5555-4555-8555-555555555555'
  replay.assessment.requested_review_state = 'confirmed'
  replay.assessment.review_comment = 'Проверено по журналу времени'
  replay.assessment.expected_version = 3
  replay.assessment.resulting_version = 4
  const replayResult = sanitizeEmployeeQualityReviewResponse(replay, binding)
  assert.equal(replayResult.idempotent, true)
  assert.equal(replayResult.assessment.review_state, 'confirmed')
  assert.equal(replayResult.assessment.version, 4)
  assert.equal(replayResult.assessment.reviewer_id, reviewerId)

  const wrongReviewer = apiResponseFixture()
  wrongReviewer.assessment.reviewed_by = '55555555-5555-4555-8555-555555555555'
  assert.throws(() => sanitizeEmployeeQualityReviewResponse(wrongReviewer, binding), /not bound/)

  const wrongVersion = apiResponseFixture()
  wrongVersion.assessment.review_version = 5
  assert.throws(() => sanitizeEmployeeQualityReviewResponse(wrongVersion, binding), /not bound/)
})

test('uses a dedicated authenticated review BFF instead of the generic catch-all', () => {
  const source = readFileSync(
    new URL('../server/api/statistics/employees/[id]/orders/[orderId]/review.patch.ts', import.meta.url),
    'utf8'
  )

  assert.match(source, /ensureDashboardAccess/)
  assert.match(source, /statistics\.quality\.review/)
  assert.match(source, /auth:\s*'required'/)
  assert.match(source, /toEmployeeQualityReviewApiRequest/)
})
