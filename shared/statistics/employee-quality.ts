import {
  getEffectiveEmployeePermissions,
  type EmployeePermission,
  type PermissionUser
} from '../auth/employees.ts'

export const employeeQualityFormulaVersion = 'employee-quality-v1' as const

export type EmployeeQualityApiScope = 'branch' | 'global' | 'self'
export type EmployeeQualityUiScope = EmployeeQualityApiScope | 'barber'

export type EmployeeQualityMetrics = {
  assessment_source: string | null
  assessment_source_counts: Record<string, number>
  classification_coverage: number
  classifiable_completed: number
  completed: number
  data_confidence: string | null
  employee_failure_count: number
  employee_failure_rate: number
  neutral_cancelled_count: number
  no_show_count: number
  not_in_time_count: number
  revenue: number
  suspicious_count: number
  suspicious_rate: number
  trusted_completed: number
}

export type EmployeeQualityEntry = {
  eligible: boolean
  employee: {
    branch_id: string | null
    id: string
    name: string
  }
  metrics: EmployeeQualityMetrics
  provisional_reason: string | null
  rank: number | null
  rank_reason: string | null
}

export type EmployeeQualityResponse = {
  data_quality: {
    unassigned_orders: number
    unclassifiable_completed: number
    unattributed_terminal_outcomes: number
  }
  employees: EmployeeQualityEntry[]
  formula_version: typeof employeeQualityFormulaVersion
  range: {
    end_date: string
    start_date: string
  }
  rules: {
    minimum_classifiable_completed: number
    minimum_classification_coverage: number
    suspicious_duration_ratio: number
  }
  scope: {
    branch_id?: string | null
    employee_id?: string | null
    type: EmployeeQualityApiScope
  }
  pagination: {
    cursor: string | null
    limit: number | null
    next_cursor: string | null
    total: number
  } | null
  timezone: string
}

export type EmployeeQualitySections = {
  eligible: EmployeeQualityEntry[]
  insufficient: EmployeeQualityEntry[]
}

export type EmployeeQualityRequestBinding = {
  branch_id?: string
  employee_id?: string
  end_date: string
  scope: EmployeeQualityApiScope
  start_date: string
}

export const employeeQualityProvisionalReasons = [
  'approximate_data',
  'employee_archived',
  'employee_inactive',
  'insufficient_classifiable_completed',
  'insufficient_classification_coverage',
  'mixed_data',
  'no_authoritative_snapshot',
  'no_completed_orders'
] as const

type QualityScopeRequest = {
  branch_id?: unknown
  employee_id?: unknown
  scope?: unknown
}

type QualityAccessUser = PermissionUser & {
  branch_id?: unknown
  id?: unknown
}

export class EmployeeQualityRequestError extends Error {
  statusCode: 400 | 403

  constructor(message: string, statusCode: 400 | 403) {
    super(message)
    this.name = 'EmployeeQualityRequestError'
    this.statusCode = statusCode
  }
}

function normalizeText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

function requireCount(value: unknown, field: string) {
  const count = Number(value)

  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`${field} must be a non-negative integer.`)
  }

  return count
}

function requireRate(value: unknown, field: string) {
  const rate = Number(value)

  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error(`${field} must be a rate from 0 to 1.`)
  }

  return rate
}

function requireMoney(value: unknown, field: string) {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${field} must be a non-negative number.`)
  }

  return amount
}

function sanitizeSourceCounts(value: unknown) {
  const source = asRecord(value)
  const allowedSources = new Set(['live_snapshot', 'backfill_current_catalog', 'unclassified'])

  for (const key of Object.keys(source)) {
    if (!allowedSources.has(key)) {
      throw new Error(`assessment_source_counts.${key} is not supported by employee-quality-v1.`)
    }
  }

  return {
    live_snapshot: requireCount(source.live_snapshot ?? 0, 'assessment_source_counts.live_snapshot'),
    backfill_current_catalog: requireCount(source.backfill_current_catalog ?? 0, 'assessment_source_counts.backfill_current_catalog'),
    unclassified: requireCount(source.unclassified ?? 0, 'assessment_source_counts.unclassified')
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Employee quality API returned an invalid object.')
  }

  return value as Record<string, unknown>
}

function permissionsFor(user: PermissionUser | EmployeePermission[] | null | undefined) {
  return new Set(Array.isArray(user) ? user : getEffectiveEmployeePermissions(user))
}

export function getAllowedEmployeeQualityScopes(user: PermissionUser | EmployeePermission[] | null | undefined): EmployeeQualityUiScope[] {
  const permissions = permissionsFor(user)

  if (permissions.has('statistics.read.global')) {
    return ['global', 'branch', 'barber']
  }

  if (permissions.has('statistics.read.branch')) {
    return ['branch', 'barber']
  }

  if (permissions.has('statistics.read.self')) {
    return ['self']
  }

  return []
}

export function resolveEmployeeQualityScope(user: QualityAccessUser, request: QualityScopeRequest) {
  const requestedScope = normalizeText(request.scope) as EmployeeQualityApiScope | null
  const allowedScopes = getAllowedEmployeeQualityScopes(user)
  const userId = normalizeText(user.id)
  const userBranchId = normalizeText(user.branch_id)

  if (!requestedScope || !['global', 'branch', 'self'].includes(requestedScope)) {
    throw new EmployeeQualityRequestError('scope must be global, branch, or self.', 400)
  }

  if (requestedScope === 'global') {
    if (!allowedScopes.includes('global')) {
      throw new EmployeeQualityRequestError('Global statistics access is not permitted.', 403)
    }

    return {
      scope: 'global' as const,
      ...(normalizeText(request.employee_id) ? { employee_id: normalizeText(request.employee_id)! } : {})
    }
  }

  if (requestedScope === 'branch') {
    if (!allowedScopes.includes('branch')) {
      throw new EmployeeQualityRequestError('Branch statistics access is not permitted.', 403)
    }

    const requestedBranchId = normalizeText(request.branch_id)
    const branchId = allowedScopes.includes('global') ? requestedBranchId : userBranchId

    if (!branchId) {
      throw new EmployeeQualityRequestError('branch_id is required for branch scope.', 400)
    }

    if (!allowedScopes.includes('global') && requestedBranchId && requestedBranchId !== userBranchId) {
      throw new EmployeeQualityRequestError('Another branch is outside the permitted scope.', 403)
    }

    return {
      branch_id: branchId,
      scope: 'branch' as const,
      ...(normalizeText(request.employee_id) ? { employee_id: normalizeText(request.employee_id)! } : {})
    }
  }

  if (!allowedScopes.includes('self') && !allowedScopes.includes('branch') && !allowedScopes.includes('global')) {
    throw new EmployeeQualityRequestError('Self statistics access is not permitted.', 403)
  }

  if (!userId) {
    throw new EmployeeQualityRequestError('The authenticated employee identifier is missing.', 403)
  }

  return {
    employee_id: userId,
    scope: 'self' as const
  }
}

export function validateEmployeeQualityDateRange(startDate: unknown, endDate: unknown) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  const start = normalizeText(startDate)
  const end = normalizeText(endDate)

  if (!start || !end || !datePattern.test(start) || !datePattern.test(end)) {
    throw new Error('start_date and end_date must use YYYY-MM-DD.')
  }

  const startTime = Date.parse(`${start}T00:00:00Z`)
  const endTime = Date.parse(`${end}T00:00:00Z`)

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    throw new Error('The requested date range is invalid.')
  }

  const normalizedStart = new Date(startTime).toISOString().slice(0, 10)
  const normalizedEnd = new Date(endTime).toISOString().slice(0, 10)

  if (normalizedStart !== start || normalizedEnd !== end) {
    throw new Error('The requested date range is invalid.')
  }

  if (startTime > endTime) {
    throw new Error('start_date must not be after end_date.')
  }

  if ((endTime - startTime) / 86_400_000 + 1 > 366) {
    throw new Error('The requested date range must not exceed 366 days.')
  }

  return { end_date: end, start_date: start }
}

export function validateEmployeeQualityPagination(cursor: unknown, limit: unknown) {
  const normalizedCursor = normalizeText(cursor)
  let normalizedLimit: number | undefined

  if (normalizedCursor && normalizedCursor.length > 512) {
    throw new EmployeeQualityRequestError('cursor is too long.', 400)
  }

  if (limit !== undefined && limit !== null && String(limit).trim() !== '') {
    normalizedLimit = Number(limit)

    if (!Number.isInteger(normalizedLimit) || normalizedLimit < 1 || normalizedLimit > 200) {
      throw new EmployeeQualityRequestError('limit must be an integer from 1 to 200.', 400)
    }
  }

  return {
    ...(normalizedCursor ? { cursor: normalizedCursor } : {}),
    ...(normalizedLimit ? { limit: normalizedLimit } : {})
  }
}

function sanitizeEntry(value: unknown): EmployeeQualityEntry {
  const source = asRecord(value)
  const employee = asRecord(source.employee)
  const metrics = asRecord(source.metrics)
  const id = normalizeText(employee.id)

  if (!id) {
    throw new Error('Employee quality API returned an employee without an id.')
  }

  const eligible = source.eligible === true
  const rankValue = source.rank === null ? null : Number(source.rank)
  const completed = requireCount(metrics.completed, 'metrics.completed')
  const classifiableCompleted = requireCount(metrics.classifiable_completed, 'metrics.classifiable_completed')
  const trustedCompleted = requireCount(metrics.trusted_completed, 'metrics.trusted_completed')
  const suspiciousCount = requireCount(metrics.suspicious_count, 'metrics.suspicious_count')
  const employeeFailureCount = requireCount(metrics.employee_failure_count, 'metrics.employee_failure_count')
  const classificationCoverage = requireRate(metrics.classification_coverage, 'metrics.classification_coverage')
  const suspiciousRate = requireRate(metrics.suspicious_rate, 'metrics.suspicious_rate')
  const employeeFailureRate = requireRate(metrics.employee_failure_rate, 'metrics.employee_failure_rate')
  const assessmentSourceCounts = sanitizeSourceCounts(metrics.assessment_source_counts)

  if (classifiableCompleted > completed) {
    throw new Error('classifiable_completed must not exceed completed.')
  }

  if (trustedCompleted + suspiciousCount !== classifiableCompleted) {
    throw new Error('trusted_completed plus suspicious_count must equal classifiable_completed.')
  }

  const classifiableAssessmentTotal = assessmentSourceCounts.live_snapshot
    + assessmentSourceCounts.backfill_current_catalog

  if (classifiableAssessmentTotal !== classifiableCompleted) {
    throw new Error('Classifiable assessment source counts must reconcile with classifiable_completed.')
  }

  if (assessmentSourceCounts.unclassified !== completed - classifiableCompleted) {
    throw new Error('Unclassified assessment source count must reconcile with completed orders.')
  }

  const expectedCoverage = completed ? classifiableCompleted / completed : 0
  const expectedSuspiciousRate = classifiableCompleted ? suspiciousCount / classifiableCompleted : 0
  const failureDenominator = trustedCompleted + employeeFailureCount
  const expectedFailureRate = failureDenominator ? employeeFailureCount / failureDenominator : 0

  for (const [field, actual, expected] of [
    ['classification_coverage', classificationCoverage, expectedCoverage],
    ['suspicious_rate', suspiciousRate, expectedSuspiciousRate],
    ['employee_failure_rate', employeeFailureRate, expectedFailureRate]
  ] as const) {
    if (Math.abs(actual - expected) > 0.0001) {
      throw new Error(`${field} is inconsistent with its source counts.`)
    }
  }

  if (eligible && (!Number.isInteger(rankValue) || Number(rankValue) <= 0)) {
    throw new Error('An eligible employee must have a positive integer rank.')
  }

  if (!eligible && rankValue !== null) {
    throw new Error('An ineligible employee must not have a rank.')
  }

  return {
    eligible,
    employee: {
      branch_id: normalizeText(employee.branch_id),
      id,
      name: normalizeText(employee.name) || `Сотрудник ${id.slice(0, 8)}`
    },
    metrics: {
      assessment_source: normalizeText(metrics.assessment_source),
      assessment_source_counts: assessmentSourceCounts,
      classification_coverage: classificationCoverage,
      classifiable_completed: classifiableCompleted,
      completed,
      data_confidence: normalizeText(metrics.data_confidence),
      employee_failure_count: employeeFailureCount,
      employee_failure_rate: employeeFailureRate,
      neutral_cancelled_count: requireCount(metrics.neutral_cancelled_count, 'metrics.neutral_cancelled_count'),
      no_show_count: requireCount(metrics.no_show_count, 'metrics.no_show_count'),
      not_in_time_count: requireCount(metrics.not_in_time_count, 'metrics.not_in_time_count'),
      revenue: requireMoney(metrics.revenue, 'metrics.revenue'),
      suspicious_count: suspiciousCount,
      suspicious_rate: suspiciousRate,
      trusted_completed: trustedCompleted
    },
    provisional_reason: normalizeText(source.provisional_reason),
    rank: eligible ? Number(rankValue) : null,
    rank_reason: normalizeText(source.rank_reason)
  }
}

export function sanitizeEmployeeQualityResponse(value: unknown): EmployeeQualityResponse {
  const source = asRecord(value)

  if (source.formula_version !== employeeQualityFormulaVersion) {
    throw new Error(`Employee quality API must return ${employeeQualityFormulaVersion}.`)
  }

  if (!Array.isArray(source.employees)) {
    throw new Error('Employee quality API returned no employees array.')
  }

  const range = asRecord(source.range)
  const rules = asRecord(source.rules)
  const scope = asRecord(source.scope)
  const dataQuality = asRecord(source.data_quality)
  const validatedRange = validateEmployeeQualityDateRange(range.start_date, range.end_date)
  const scopeType = normalizeText(scope.type) as EmployeeQualityApiScope | null

  if (!scopeType || !['global', 'branch', 'self'].includes(scopeType)) {
    throw new Error('Employee quality API returned an invalid scope.')
  }

  const employees = source.employees.map(sanitizeEntry)
  const minimumClassifiableCompleted = requireCount(rules.minimum_classifiable_completed, 'rules.minimum_classifiable_completed')
  const minimumClassificationCoverage = requireRate(rules.minimum_classification_coverage, 'rules.minimum_classification_coverage')
  const suspiciousDurationRatio = requireRate(rules.suspicious_duration_ratio, 'rules.suspicious_duration_ratio')

  for (const entry of employees) {
    const reason = entry.provisional_reason
    const isAdministrativeExclusion = reason === 'employee_archived' || reason === 'employee_inactive'
    const hasMinimumVolume = entry.metrics.classifiable_completed >= minimumClassifiableCompleted
    const hasMinimumCoverage = entry.metrics.classification_coverage >= minimumClassificationCoverage
    const hasAuthoritativeEvidence = entry.metrics.assessment_source === 'live_snapshot'
      && entry.metrics.data_confidence === 'authoritative'
      && entry.metrics.assessment_source_counts.live_snapshot === entry.metrics.classifiable_completed
      && entry.metrics.assessment_source_counts.backfill_current_catalog === 0
    const shouldBeEligible = entry.metrics.classifiable_completed >= minimumClassifiableCompleted
      && entry.metrics.classification_coverage >= minimumClassificationCoverage
      && hasAuthoritativeEvidence

    if (entry.eligible && (!shouldBeEligible || reason)) {
      throw new Error('Employee eligibility is inconsistent with rules and data confidence.')
    }

    if (!entry.eligible) {
      if (!reason || !employeeQualityProvisionalReasons.includes(reason as typeof employeeQualityProvisionalReasons[number])) {
        throw new Error('An ineligible employee must have a supported provisional_reason.')
      }

      const reasonIsConsistent = isAdministrativeExclusion
        || (reason === 'no_completed_orders' && entry.metrics.completed === 0)
        || (reason === 'insufficient_classifiable_completed' && !hasMinimumVolume)
        || (reason === 'insufficient_classification_coverage' && !hasMinimumCoverage)
        || (['approximate_data', 'mixed_data', 'no_authoritative_snapshot'].includes(reason) && !hasAuthoritativeEvidence)

      if (!reasonIsConsistent || (shouldBeEligible && !isAdministrativeExclusion)) {
        throw new Error('Employee provisional_reason is inconsistent with eligibility evidence.')
      }
    }
  }


  const eligibleByQuality = employees
    .filter(entry => entry.eligible)
    .sort((left, right) => {
      const leftMetrics = left.metrics
      const rightMetrics = right.metrics

      return Number(leftMetrics.suspicious_count > 0) - Number(rightMetrics.suspicious_count > 0)
        || leftMetrics.suspicious_count - rightMetrics.suspicious_count
        || leftMetrics.suspicious_rate - rightMetrics.suspicious_rate
        || rightMetrics.trusted_completed - leftMetrics.trusted_completed
        || leftMetrics.employee_failure_rate - rightMetrics.employee_failure_rate
        || leftMetrics.employee_failure_count - rightMetrics.employee_failure_count
        || left.employee.id.localeCompare(right.employee.id)
    })
  let previousQualityKey = ''
  let previousRank = 0

  eligibleByQuality.forEach((entry) => {
    const qualityKey = [
      Number(entry.metrics.suspicious_count > 0),
      entry.metrics.suspicious_count,
      entry.metrics.suspicious_rate,
      entry.metrics.trusted_completed,
      entry.metrics.employee_failure_rate,
      entry.metrics.employee_failure_count
    ].join('|')
    if (previousQualityKey) {
      if (qualityKey === previousQualityKey && entry.rank !== previousRank) {
        throw new Error('Employees with equal quality keys must share a rank.')
      }

      if (qualityKey !== previousQualityKey && Number(entry.rank) <= previousRank) {
        throw new Error('Employee rank is inconsistent with employee-quality-v1 ordering.')
      }
    }

    previousQualityKey = qualityKey
    previousRank = Number(entry.rank)
  })

  let pagination: EmployeeQualityResponse['pagination'] = null
  if (source.pagination !== undefined && source.pagination !== null) {
    const rawPagination = asRecord(source.pagination)
    const rawLimit = rawPagination.limit

    pagination = {
      cursor: normalizeText(rawPagination.cursor),
      limit: rawLimit === null || rawLimit === undefined ? null : requireCount(rawLimit, 'pagination.limit'),
      next_cursor: normalizeText(rawPagination.next_cursor),
      total: requireCount(rawPagination.total, 'pagination.total')
    }

    if (pagination.total < employees.length) {
      throw new Error('pagination.total must not be smaller than the returned employee count.')
    }

    if (employees.some(entry => entry.rank !== null && entry.rank > pagination!.total)) {
      throw new Error('Employee rank must not exceed pagination.total.')
    }
  }

  const timezone = normalizeText(source.timezone)

  if (timezone !== 'Asia/Tashkent') {
    throw new Error('Employee quality API must use Asia/Tashkent timezone.')
  }

  return {
    data_quality: {
      unassigned_orders: requireCount(dataQuality.unassigned_orders, 'data_quality.unassigned_orders'),
      unclassifiable_completed: requireCount(dataQuality.unclassifiable_completed, 'data_quality.unclassifiable_completed'),
      unattributed_terminal_outcomes: requireCount(dataQuality.unattributed_terminal_outcomes, 'data_quality.unattributed_terminal_outcomes')
    },
    employees,
    formula_version: employeeQualityFormulaVersion,
    range: validatedRange,
    rules: {
      minimum_classifiable_completed: minimumClassifiableCompleted,
      minimum_classification_coverage: minimumClassificationCoverage,
      suspicious_duration_ratio: suspiciousDurationRatio
    },
    pagination,
    scope: {
      branch_id: normalizeText(scope.branch_id),
      employee_id: normalizeText(scope.employee_id),
      type: scopeType
    },
    timezone
  }
}

export function assertEmployeeQualityResponseBinding(
  response: EmployeeQualityResponse,
  binding: EmployeeQualityRequestBinding
) {
  const expectedBranchId = normalizeText(binding.branch_id)
  const expectedEmployeeId = normalizeText(binding.employee_id)

  if (response.timezone !== 'Asia/Tashkent'
    || response.range.start_date !== binding.start_date
    || response.range.end_date !== binding.end_date
    || response.scope.type !== binding.scope
    || normalizeText(response.scope.branch_id) !== expectedBranchId
    || normalizeText(response.scope.employee_id) !== expectedEmployeeId) {
    throw new Error('Employee quality API response is not bound to the requested range and scope.')
  }

  const employeeIds = new Set<string>()

  for (const entry of response.employees) {
    if (employeeIds.has(entry.employee.id)) {
      throw new Error('Employee quality API returned a duplicate employee id.')
    }
    employeeIds.add(entry.employee.id)

    if (binding.scope === 'branch' && entry.employee.branch_id !== expectedBranchId) {
      throw new Error('Employee quality API returned an employee outside the requested branch.')
    }

    if (expectedEmployeeId && entry.employee.id !== expectedEmployeeId) {
      throw new Error('Employee quality API returned an employee outside the requested employee filter.')
    }
  }

  return response
}

export function buildEmployeeQualitySections(entries: EmployeeQualityEntry[]): EmployeeQualitySections {
  const eligible = entries
    .filter(entry => entry.eligible && entry.rank !== null)
    .sort((left, right) => {
      return (left.rank! - right.rank!)
        || left.employee.name.localeCompare(right.employee.name, 'ru')
        || left.employee.id.localeCompare(right.employee.id)
    })
  const insufficient = entries
    .filter(entry => !entry.eligible || entry.rank === null)
    .sort((left, right) => left.employee.name.localeCompare(right.employee.name, 'ru'))

  return { eligible, insufficient }
}

export function getEmployeeQualityErrorMessage(error: unknown) {
  const source = error as Record<string, any> | null
  const status = Number(source?.statusCode || source?.status || source?.response?.status || 0)
  const data = source?.data || source?.response?._data
  const message = normalizeText(data?.message || data?.error || source?.message)

  if ([404, 501].includes(status)) {
    return 'Серверный рейтинг качества ещё не доступен. Рейтинг по выручке вместо него не показывается.'
  }

  if ([401, 403].includes(status)) {
    return 'Нет доступа к рейтингу качества для выбранной области.'
  }

  return message || 'Не удалось загрузить рейтинг качества сотрудников.'
}
