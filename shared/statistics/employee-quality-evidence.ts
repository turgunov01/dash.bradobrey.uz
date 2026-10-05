import {
  employeeQualityFormulaVersion,
  type EmployeeQualityRequestBinding,
  validateEmployeeQualityDateRange,
  validateEmployeeQualityPagination
} from './employee-quality.ts'

export const employeeQualityEvidenceCategories = ['suspicious', 'employee_failure', 'unclassified'] as const
export const employeeQualityReviewStates = ['unreviewed', 'confirmed', 'dismissed'] as const

export type EmployeeQualityEvidenceCategory = typeof employeeQualityEvidenceCategories[number]

export type EmployeeQualityEvidenceOrder = {
  actual_minutes: number | null
  assessment_source: string | null
  branch_id: string
  classification: string
  completed_at: string | null
  data_confidence: string | null
  employee_id: string
  expected_minutes: number | null
  occurred_at: string | null
  order_id: string
  reason_code: string | null
  review_state: string | null
  rule_code: string | null
  rule_version: string | null
  status: string
}

export type EmployeeQualityEvidenceResponse = {
  category: EmployeeQualityEvidenceCategory
  formula_version: typeof employeeQualityFormulaVersion
  orders: EmployeeQualityEvidenceOrder[]
  pagination: {
    cursor: string | null
    limit: number | null
    next_cursor: string | null
    total: number
  }
  range: { end_date: string, start_date: string }
  scope: {
    branch_id: string | null
    employee_id: string
    type: EmployeeQualityRequestBinding['scope']
  }
  timezone: 'Asia/Tashkent'
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Employee quality evidence API returned an invalid object.')
  }
  return value as Record<string, unknown>
}

function text(value: unknown) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function requiredText(value: unknown, field: string) {
  const normalized = text(value)
  if (!normalized) throw new Error(`${field} is required.`)
  return normalized
}

function count(value: unknown, field: string) {
  const normalized = Number(value)
  if (!Number.isInteger(normalized) || normalized < 0) throw new Error(`${field} must be a non-negative integer.`)
  return normalized
}

function nullableMinutes(value: unknown, field: string) {
  if (value === null || value === undefined) return null
  const normalized = Number(value)
  if (!Number.isFinite(normalized) || normalized < 0) throw new Error(`${field} must be a non-negative number.`)
  return normalized
}

function nullableTimestamp(value: unknown, field: string) {
  const normalized = text(value)
  if (!normalized) return null
  if (!Number.isFinite(Date.parse(normalized))) throw new Error(`${field} must be a valid timestamp.`)
  return normalized
}

export function validateEmployeeQualityEvidenceQuery(category: unknown, reviewState: unknown, cursor: unknown, limit: unknown) {
  const normalizedCategory = text(category) as EmployeeQualityEvidenceCategory | null
  const normalizedReviewState = text(reviewState)

  if (!normalizedCategory || !employeeQualityEvidenceCategories.includes(normalizedCategory)) {
    throw new Error('category must be suspicious, employee_failure, or unclassified.')
  }

  if (normalizedReviewState && !employeeQualityReviewStates.includes(normalizedReviewState as typeof employeeQualityReviewStates[number])) {
    throw new Error('review_state is invalid.')
  }

  if (normalizedReviewState && normalizedCategory !== 'suspicious') {
    throw new Error('review_state is supported only for suspicious evidence.')
  }

  return {
    category: normalizedCategory,
    ...(normalizedReviewState ? { review_state: normalizedReviewState } : {}),
    ...validateEmployeeQualityPagination(cursor, limit)
  }
}

export function sanitizeEmployeeQualityEvidenceResponse(
  value: unknown,
  binding: EmployeeQualityRequestBinding & {
    category: EmployeeQualityEvidenceCategory
    cursor?: string
    limit?: number
  }
): EmployeeQualityEvidenceResponse {
  const source = asRecord(value)
  const range = asRecord(source.range)
  const scope = asRecord(source.scope)
  const paginationSource = asRecord(source.pagination)
  const responseRange = validateEmployeeQualityDateRange(range.start_date, range.end_date)
  const category = text(source.category)
  const scopeType = text(scope.type)
  const scopeBranchId = text(scope.branch_id)
  const scopeEmployeeId = text(scope.employee_id)

  if (source.formula_version !== employeeQualityFormulaVersion
    || text(source.timezone) !== 'Asia/Tashkent'
    || category !== binding.category
    || responseRange.start_date !== binding.start_date
    || responseRange.end_date !== binding.end_date
    || scopeType !== binding.scope
    || scopeBranchId !== text(binding.branch_id)
    || scopeEmployeeId !== text(binding.employee_id)) {
    throw new Error('Employee quality evidence response is not bound to the requested employee, range, and scope.')
  }

  if (!Array.isArray(source.orders)) throw new Error('Employee quality evidence API returned no orders array.')

  const orderIds = new Set<string>()
  const orders = source.orders.map((value): EmployeeQualityEvidenceOrder => {
    const order = asRecord(value)
    const orderId = requiredText(order.order_id, 'order_id')
    const employeeId = requiredText(order.employee_id, 'employee_id')
    const branchId = requiredText(order.branch_id, 'branch_id')
    const classification = requiredText(order.classification, 'classification')
    const reviewState = text(order.review_state)

    if (orderIds.has(orderId)) throw new Error('Employee quality evidence API returned a duplicate order id.')
    orderIds.add(orderId)

    if (employeeId !== binding.employee_id || (binding.scope === 'branch' && branchId !== binding.branch_id)) {
      throw new Error('Employee quality evidence API returned an order outside the requested scope.')
    }

    if (classification !== binding.category) {
      throw new Error('Employee quality evidence API returned an order outside the requested category.')
    }

    if (reviewState && !employeeQualityReviewStates.includes(reviewState as typeof employeeQualityReviewStates[number])) {
      throw new Error('Employee quality evidence API returned an invalid review state.')
    }

    return {
      actual_minutes: nullableMinutes(order.actual_minutes, 'actual_minutes'),
      assessment_source: text(order.assessment_source),
      branch_id: branchId,
      classification,
      completed_at: nullableTimestamp(order.completed_at, 'completed_at'),
      data_confidence: text(order.data_confidence),
      employee_id: employeeId,
      expected_minutes: nullableMinutes(order.expected_minutes, 'expected_minutes'),
      occurred_at: nullableTimestamp(order.occurred_at, 'occurred_at'),
      order_id: orderId,
      reason_code: text(order.reason_code),
      review_state: reviewState,
      rule_code: text(order.rule_code),
      rule_version: text(order.rule_version),
      status: requiredText(order.status, 'status')
    }
  })

  const pagination = {
    cursor: text(paginationSource.cursor),
    limit: paginationSource.limit === null || paginationSource.limit === undefined
      ? null
      : count(paginationSource.limit, 'pagination.limit'),
    next_cursor: text(paginationSource.next_cursor),
    total: count(paginationSource.total, 'pagination.total')
  }

  if (pagination.total < orders.length) throw new Error('Evidence pagination total is smaller than the returned order count.')
  if (pagination.cursor !== text(binding.cursor)) throw new Error('Evidence pagination cursor is not bound to the request.')
  if (binding.limit !== undefined && pagination.limit !== binding.limit) throw new Error('Evidence pagination limit is not bound to the request.')

  return {
    category: binding.category,
    formula_version: employeeQualityFormulaVersion,
    orders,
    pagination,
    range: responseRange,
    scope: {
      branch_id: scopeBranchId,
      employee_id: scopeEmployeeId!,
      type: binding.scope
    },
    timezone: 'Asia/Tashkent'
  }
}
