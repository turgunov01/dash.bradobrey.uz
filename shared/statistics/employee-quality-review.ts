import type { EmployeeQualityApiScope } from './employee-quality.ts'

export const employeeQualityReviewDecisions = ['confirmed', 'dismissed'] as const
export type EmployeeQualityReviewDecision = typeof employeeQualityReviewDecisions[number]

export type EmployeeQualityReviewRequest = {
  decision: EmployeeQualityReviewDecision
  expected_version: number
  idempotency_key: string
  reason: string
}

export type EmployeeQualityReviewApiRequest = {
  expected_version: number
  idempotency_key: string
  review_comment: string
  review_state: EmployeeQualityReviewDecision
}

export type EmployeeQualityReviewResponse = {
  assessment: {
    branch_id: string
    employee_id: string
    order_id: string
    review_state: EmployeeQualityReviewDecision
    reviewed_at: string
    reviewer_id: string
    version: number
  }
  idempotent: boolean
}

type ReviewBinding = {
  branch_id?: string
  decision: EmployeeQualityReviewDecision
  employee_id: string
  expected_version: number
  order_id: string
  reason: string
  reviewer_id: string
  scope: EmployeeQualityApiScope
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Employee quality review payload must be an object.')
  }
  return value as Record<string, unknown>
}

function text(value: unknown) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function requiredText(value: unknown, field: string, maximumLength = 200) {
  const normalized = text(value)
  if (!normalized) throw new Error(`${field} is required.`)
  if (normalized.length > maximumLength) throw new Error(`${field} is too long.`)
  return normalized
}

function version(value: unknown, field: string) {
  const normalized = Number(value)
  if (!Number.isInteger(normalized) || normalized < 0) throw new Error(`${field} must be a non-negative integer.`)
  return normalized
}

export function sanitizeEmployeeQualityReviewRequest(value: unknown): EmployeeQualityReviewRequest {
  const source = asRecord(value)
  const decision = text(source.decision) as EmployeeQualityReviewDecision | null
  const idempotencyKey = requiredText(source.idempotency_key, 'idempotency_key', 100)

  if (!decision || !employeeQualityReviewDecisions.includes(decision)) {
    throw new Error('decision must be confirmed or dismissed.')
  }

  if (!/^[A-Za-z0-9._:-]{8,100}$/.test(idempotencyKey)) {
    throw new Error('idempotency_key must be 8-100 safe characters.')
  }

  return {
    decision,
    expected_version: version(source.expected_version, 'expected_version'),
    idempotency_key: idempotencyKey,
    reason: requiredText(source.reason, 'reason', 1000)
  }
}

export function toEmployeeQualityReviewApiRequest(
  request: EmployeeQualityReviewRequest
): EmployeeQualityReviewApiRequest {
  return {
    expected_version: request.expected_version,
    idempotency_key: request.idempotency_key,
    review_comment: request.reason,
    review_state: request.decision
  }
}

export function sanitizeEmployeeQualityReviewResponse(
  value: unknown,
  binding: ReviewBinding
): EmployeeQualityReviewResponse {
  const source = asRecord(value)
  const assessment = asRecord(source.assessment)
  const responseState = text(assessment.review_state)
  const reviewedAt = requiredText(assessment.reviewed_at, 'assessment.reviewed_at')
  const responseBranchId = requiredText(assessment.branch_id, 'assessment.branch_id')
  const responseEmployeeId = requiredText(assessment.employee_id, 'assessment.employee_id')
  const responseOrderId = requiredText(assessment.order_id, 'assessment.order_id')
  const responseReviewerId = requiredText(assessment.reviewed_by, 'assessment.reviewed_by')
  const responseVersion = version(assessment.review_version, 'assessment.review_version')

  if (typeof source.idempotent !== 'boolean') {
    throw new Error('Employee quality review API returned an invalid idempotent flag.')
  }

  if (!Number.isFinite(Date.parse(reviewedAt))) {
    throw new Error('assessment.reviewed_at must be a valid timestamp.')
  }

  if (assessment.suspicious !== true
    || responseEmployeeId !== binding.employee_id
    || responseOrderId !== binding.order_id
    || (binding.scope === 'branch' && responseBranchId !== binding.branch_id)) {
    throw new Error('Employee quality review response is not bound to the authorized request.')
  }

  let outwardState = responseState
  let outwardVersion = responseVersion
  let outwardReviewerId = responseReviewerId

  if (source.idempotent) {
    const requestedState = text(assessment.requested_review_state)
    const replayComment = text(assessment.review_comment)
    const replayExpectedVersion = version(assessment.expected_version, 'assessment.expected_version')
    const replayResultingVersion = version(assessment.resulting_version, 'assessment.resulting_version')

    if (requestedState !== binding.decision
      || replayComment !== binding.reason
      || replayExpectedVersion !== binding.expected_version
      || replayResultingVersion !== binding.expected_version + 1) {
      throw new Error('Employee quality review replay is not bound to the original request.')
    }

    outwardState = requestedState
    outwardVersion = replayResultingVersion
    outwardReviewerId = binding.reviewer_id
  }
  else if (responseReviewerId !== binding.reviewer_id
    || responseVersion !== binding.expected_version + 1
    || responseState !== binding.decision) {
    throw new Error('Employee quality review response is not bound to the authorized request.')
  }

  return {
    assessment: {
      branch_id: responseBranchId,
      employee_id: responseEmployeeId,
      order_id: responseOrderId,
      review_state: outwardState as EmployeeQualityReviewDecision,
      reviewed_at: reviewedAt,
      reviewer_id: outwardReviewerId,
      version: outwardVersion
    },
    idempotent: source.idempotent
  }
}
