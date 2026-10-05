import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  assertEmployeeQualityResponseBinding,
  buildEmployeeQualitySections,
  EmployeeQualityRequestError,
  getAllowedEmployeeQualityScopes,
  getEmployeeQualityErrorMessage,
  resolveEmployeeQualityScope,
  sanitizeEmployeeQualityResponse,
  validateEmployeeQualityDateRange,
  validateEmployeeQualityPagination
} from '../shared/statistics/employee-quality.ts'

function metrics(overrides: Record<string, unknown> = {}) {
  return {
    assessment_source: 'live_snapshot',
    assessment_source_counts: { live_snapshot: 44, backfill_current_catalog: 0, unclassified: 0 },
    classification_coverage: 1,
    classifiable_completed: 44,
    completed: 44,
    data_confidence: 'authoritative',
    employee_failure_count: 1,
    employee_failure_rate: 1 / 43,
    neutral_cancelled_count: 2,
    no_show_count: 3,
    not_in_time_count: 1,
    revenue: 1_234_567,
    suspicious_count: 2,
    suspicious_rate: 2 / 44,
    trusted_completed: 42,
    ...overrides
  }
}

function response(employees: unknown[]) {
  return {
    data_quality: {
      unassigned_orders: 0,
      unclassifiable_completed: 0,
      unattributed_terminal_outcomes: 0
    },
    employees,
    formula_version: 'employee-quality-v1',
    pagination: { cursor: null, limit: 50, next_cursor: null, total: employees.length },
    range: { start_date: '2026-10-01', end_date: '2026-10-31' },
    rules: {
      minimum_classifiable_completed: 10,
      minimum_classification_coverage: 0.9,
      suspicious_duration_ratio: 0.5
    },
    scope: { type: 'global' },
    timezone: 'Asia/Tashkent'
  }
}

test('exposes only statistics scopes granted by effective permissions', () => {
  assert.deepEqual(getAllowedEmployeeQualityScopes({ permissions: ['statistics.read.self'] }), ['self'])
  assert.deepEqual(getAllowedEmployeeQualityScopes({ permissions: ['statistics.read.branch'] }), ['branch', 'barber'])
  assert.deepEqual(getAllowedEmployeeQualityScopes({ permissions: ['statistics.read.global'] }), ['global', 'branch', 'barber'])
  assert.deepEqual(getAllowedEmployeeQualityScopes({ permissions: [] }), [])
})

test('enforces branch/global/self scope at the server boundary', () => {
  assert.deepEqual(
    resolveEmployeeQualityScope(
      { id: 'manager-1', branch_id: 'branch-a', permissions: ['statistics.read.branch'] },
      { scope: 'branch', branch_id: 'branch-a', employee_id: 'employee-1' }
    ),
    { scope: 'branch', branch_id: 'branch-a', employee_id: 'employee-1' }
  )
  assert.deepEqual(
    resolveEmployeeQualityScope(
      { id: 'employee-1', branch_id: 'branch-a', permissions: ['statistics.read.self'] },
      { scope: 'self', employee_id: 'employee-2' }
    ),
    { scope: 'self', employee_id: 'employee-1' }
  )

  assert.throws(
    () => resolveEmployeeQualityScope(
      { id: 'manager-1', branch_id: 'branch-a', permissions: ['statistics.read.branch'] },
      { scope: 'global' }
    ),
    (error: unknown) => error instanceof EmployeeQualityRequestError && error.statusCode === 403
  )
  assert.throws(
    () => resolveEmployeeQualityScope(
      { id: 'manager-1', branch_id: 'branch-a', permissions: ['statistics.read.branch'] },
      { scope: 'branch', branch_id: 'branch-b' }
    ),
    (error: unknown) => error instanceof EmployeeQualityRequestError && error.statusCode === 403
  )
  assert.throws(
    () => resolveEmployeeQualityScope(
      { id: 'manager-1', branch_id: 'branch-a', permissions: ['statistics.read.branch'] },
      { scope: 'unknown' }
    ),
    (error: unknown) => error instanceof EmployeeQualityRequestError && error.statusCode === 400
  )
})

test('validates date format, real calendar dates, order and maximum range', () => {
  assert.deepEqual(validateEmployeeQualityDateRange('2026-10-01', '2026-10-31'), {
    start_date: '2026-10-01',
    end_date: '2026-10-31'
  })
  assert.throws(() => validateEmployeeQualityDateRange('2026-02-30', '2026-03-01'))
  assert.throws(() => validateEmployeeQualityDateRange('2026-10-02', '2026-10-01'))
  assert.throws(() => validateEmployeeQualityDateRange('2025-01-01', '2026-01-02'))
  assert.deepEqual(validateEmployeeQualityPagination('next-page', '50'), { cursor: 'next-page', limit: 50 })
  assert.throws(() => validateEmployeeQualityPagination(null, 0))
  assert.throws(() => validateEmployeeQualityPagination(null, 201))
})

test('sanitizes the aggregate to PII-free fields and preserves source/pagination metadata', () => {
  const payload = response([{
    eligible: true,
    employee: { id: 'e1', name: 'Алишер', branch_id: 'b1', phone: '+998-secret' },
    metrics: metrics(),
    phone: '+998-secret',
    provisional_reason: null,
    rank: 1,
    rank_reason: 'Надёжный результат'
  }])
  const result = sanitizeEmployeeQualityResponse(payload)

  assert.equal((result.employees[0]!.employee as Record<string, unknown>).phone, undefined)
  assert.equal((result.employees[0] as unknown as Record<string, unknown>).phone, undefined)
  assert.equal(result.employees[0]!.metrics.assessment_source, 'live_snapshot')
  assert.deepEqual(result.employees[0]!.metrics.assessment_source_counts, {
    live_snapshot: 44,
    backfill_current_catalog: 0,
    unclassified: 0
  })
  assert.deepEqual(result.pagination, {
    cursor: null,
    limit: 50,
    next_cursor: null,
    total: 1
  })
  assert.equal(result.rules.suspicious_duration_ratio, 0.5)
})

test('fails closed when aggregate invariants or eligibility are inconsistent', () => {
  assert.throws(() => sanitizeEmployeeQualityResponse(response([{
    eligible: true,
    employee: { id: 'e1', name: 'Алишер', branch_id: 'b1' },
    metrics: metrics({ trusted_completed: 43 }),
    provisional_reason: null,
    rank: 1,
    rank_reason: null
  }])), /trusted_completed plus suspicious_count/)

  assert.throws(() => sanitizeEmployeeQualityResponse(response([{
    eligible: false,
    employee: { id: 'e1', name: 'Алишер', branch_id: 'b1' },
    metrics: metrics(),
    provisional_reason: 'insufficient_classifiable_completed',
    rank: null,
    rank_reason: null
  }])), /provisional_reason is inconsistent/)

  assert.throws(() => sanitizeEmployeeQualityResponse(response([{
    eligible: true,
    employee: { id: 'e1', name: 'Алишер', branch_id: 'b1' },
    metrics: metrics({
      assessment_source_counts: { live_snapshot: 43, backfill_current_catalog: 0, unclassified: 0 }
    }),
    provisional_reason: null,
    rank: 1,
    rank_reason: null
  }])), /source counts must reconcile/)

  assert.throws(() => sanitizeEmployeeQualityResponse(response([
    {
      eligible: true,
      employee: { id: 'e1', name: 'Алишер', branch_id: 'b1' },
      metrics: metrics(),
      provisional_reason: null,
      rank: 1,
      rank_reason: null
    },
    {
      eligible: true,
      employee: { id: 'e2', name: 'Бек', branch_id: 'b1' },
      metrics: metrics(),
      provisional_reason: null,
      rank: 2,
      rank_reason: null
    }
  ])), /equal quality keys must share a rank/)
})

test('accepts inactive and archived employees as explicit administrative exclusions', () => {
  for (const provisionalReason of ['employee_inactive', 'employee_archived']) {
    const result = sanitizeEmployeeQualityResponse(response([{
      eligible: false,
      employee: { id: `e-${provisionalReason}`, name: 'Неактивный сотрудник', branch_id: 'b1' },
      metrics: metrics(),
      provisional_reason: provisionalReason,
      rank: null,
      rank_reason: null
    }]))

    assert.equal(result.employees[0]!.eligible, false)
    assert.equal(result.employees[0]!.provisional_reason, provisionalReason)
  }
})

test('binds aggregate responses to the exact requested range and scope', () => {
  const payload = response([{
    eligible: true,
    employee: { id: 'e1', name: 'Алишер', branch_id: 'b1' },
    metrics: metrics(),
    provisional_reason: null,
    rank: 1,
    rank_reason: null
  }])
  payload.scope = { type: 'branch', branch_id: 'b1', employee_id: 'e1' } as any
  const result = sanitizeEmployeeQualityResponse(payload)
  const binding = {
    branch_id: 'b1',
    employee_id: 'e1',
    end_date: '2026-10-31',
    scope: 'branch' as const,
    start_date: '2026-10-01'
  }

  assert.equal(assertEmployeeQualityResponseBinding(result, binding), result)
  assert.throws(
    () => assertEmployeeQualityResponseBinding(result, { ...binding, end_date: '2026-10-30' }),
    /not bound/
  )

  const outOfBranch = structuredClone(result)
  outOfBranch.employees[0]!.employee.branch_id = 'b2'
  assert.throws(() => assertEmployeeQualityResponseBinding(outOfBranch, binding), /outside the requested branch/)

  const duplicate = structuredClone(result)
  duplicate.employees.push(structuredClone(duplicate.employees[0]!))
  assert.throws(() => assertEmployeeQualityResponseBinding(duplicate, binding), /duplicate employee id/)
})

test('uses API rank for ordering and keeps revenue informational', () => {
  const first = sanitizeEmployeeQualityResponse(response([
    {
      eligible: true,
      employee: { id: 'e2', name: 'Бек', branch_id: 'b1' },
      metrics: metrics({
        employee_failure_rate: 1 / 42,
        revenue: 99_000_000,
        suspicious_count: 3,
        suspicious_rate: 3 / 44,
        trusted_completed: 41
      }),
      provisional_reason: null,
      rank: 2,
      rank_reason: null
    },
    {
      eligible: true,
      employee: { id: 'e1', name: 'Алишер', branch_id: 'b1' },
      metrics: metrics({ revenue: 1 }),
      provisional_reason: null,
      rank: 1,
      rank_reason: null
    }
  ]))
  const changedRevenue = sanitizeEmployeeQualityResponse(response(first.employees.map(entry => ({
    ...entry,
    metrics: { ...entry.metrics, revenue: entry.employee.id === 'e1' ? 500_000_000 : 0 }
  }))))

  assert.deepEqual(buildEmployeeQualitySections(first.employees).eligible.map(row => row.employee.id), ['e1', 'e2'])
  assert.deepEqual(buildEmployeeQualitySections(changedRevenue.employees).eligible.map(row => row.employee.id), ['e1', 'e2'])
})

test('separates insufficient-data employees and exposes explicit error copy', () => {
  const result = sanitizeEmployeeQualityResponse(response([{
    eligible: false,
    employee: { id: 'e1', name: 'Новый сотрудник', branch_id: 'b1' },
    metrics: metrics({
      assessment_source_counts: { live_snapshot: 9, backfill_current_catalog: 0, unclassified: 0 },
      classifiable_completed: 9,
      completed: 9,
      employee_failure_count: 0,
      employee_failure_rate: 0,
      suspicious_count: 0,
      suspicious_rate: 0,
      trusted_completed: 9
    }),
    provisional_reason: 'insufficient_classifiable_completed',
    rank: null,
    rank_reason: null
  }]))

  assert.equal(buildEmployeeQualitySections(result.employees).eligible.length, 0)
  assert.equal(buildEmployeeQualitySections(result.employees).insufficient.length, 1)
  assert.match(getEmployeeQualityErrorMessage({ statusCode: 404 }), /не доступен/)
  assert.match(getEmployeeQualityErrorMessage({ statusCode: 403 }), /Нет доступа/)
})
