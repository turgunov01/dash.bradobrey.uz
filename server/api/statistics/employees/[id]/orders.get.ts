import { createError, getQuery, getRouterParam, setResponseStatus } from 'h3'

import { getEffectiveEmployeePermissions } from '~~/shared/auth/employees'
import {
  sanitizeEmployeeQualityEvidenceResponse,
  validateEmployeeQualityEvidenceQuery
} from '~~/shared/statistics/employee-quality-evidence'
import {
  EmployeeQualityRequestError,
  resolveEmployeeQualityScope,
  validateEmployeeQualityDateRange
} from '~~/shared/statistics/employee-quality'
import { backendRequest } from '~~/server/utils/backend'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'

function requestError(error: unknown) {
  throw createError({
    statusCode: error instanceof EmployeeQualityRequestError ? error.statusCode : 400,
    message: error instanceof Error ? error.message : 'Некорректный запрос доказательств рейтинга.'
  })
}

export default defineEventHandler(async (event) => {
  const accessUser = await ensureDashboardAccess(event)
  const employeeId = String(getRouterParam(event, 'id') || '').trim()
  const query = getQuery(event)

  if (!employeeId || employeeId.length > 200 || employeeId.includes('/')) {
    throw createError({ statusCode: 400, message: 'Некорректный идентификатор сотрудника.' })
  }

  let range: ReturnType<typeof validateEmployeeQualityDateRange>
  let evidenceQuery: ReturnType<typeof validateEmployeeQualityEvidenceQuery>
  let scope: ReturnType<typeof resolveEmployeeQualityScope>

  try {
    range = validateEmployeeQualityDateRange(query.start_date, query.end_date)
    evidenceQuery = validateEmployeeQualityEvidenceQuery(query.category, query.review_state, query.cursor, query.limit)
    scope = resolveEmployeeQualityScope(accessUser, { ...query, employee_id: employeeId })
  }
  catch (error) {
    return requestError(error)
  }

  if (scope.scope === 'self' && scope.employee_id !== employeeId) {
    throw createError({ statusCode: 403, message: 'Доказательства другого сотрудника недоступны.' })
  }

  const permissions = new Set(getEffectiveEmployeePermissions(accessUser))
  const canReadEvidence = scope.scope === 'self'
    ? permissions.has('history.read.self') || permissions.has('history.read.branch')
    : permissions.has('history.read.branch')

  if (!canReadEvidence) {
    throw createError({ statusCode: 403, message: 'Нет права просмотра истории для доказательств рейтинга.' })
  }

  const binding = {
    ...range,
    ...scope,
    category: evidenceQuery.category,
    employee_id: employeeId,
    ...(evidenceQuery.cursor ? { cursor: evidenceQuery.cursor } : {}),
    ...(evidenceQuery.limit ? { limit: evidenceQuery.limit } : {})
  }
  const response = await backendRequest<unknown>(event, {
    auth: 'required',
    method: 'GET',
    path: `/api/statistics/employees/${encodeURIComponent(employeeId)}/orders`,
    query: {
      ...binding,
      ...(evidenceQuery.review_state ? { review_state: evidenceQuery.review_state } : {}),
    }
  })

  try {
    const payload = sanitizeEmployeeQualityEvidenceResponse(response.data, binding)
    setResponseStatus(event, response.status)
    return payload
  }
  catch (error) {
    throw createError({
      statusCode: 502,
      message: error instanceof Error ? error.message : 'Некорректный ответ API доказательств рейтинга.'
    })
  }
})
