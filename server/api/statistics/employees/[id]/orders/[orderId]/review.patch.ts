import { createError, getQuery, getRouterParam, readBody, setResponseStatus } from 'h3'

import { getEffectiveEmployeePermissions } from '~~/shared/auth/employees'
import {
  sanitizeEmployeeQualityReviewRequest,
  sanitizeEmployeeQualityReviewResponse,
  toEmployeeQualityReviewApiRequest
} from '~~/shared/statistics/employee-quality-review'
import {
  EmployeeQualityRequestError,
  resolveEmployeeQualityScope
} from '~~/shared/statistics/employee-quality'
import { backendRequest } from '~~/server/utils/backend'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function identifier(value: unknown, field: string) {
  const normalized = String(value ?? '').trim()
  if (!uuidPattern.test(normalized)) {
    throw createError({ statusCode: 400, message: `${field} must be a UUID.` })
  }
  return normalized
}

export default defineEventHandler(async (event) => {
  const accessUser = await ensureDashboardAccess(event)
  const accessRecord = accessUser as typeof accessUser & { id?: unknown }
  const employeeId = identifier(getRouterParam(event, 'id'), 'employeeId')
  const orderId = identifier(getRouterParam(event, 'orderId'), 'orderId')
  const reviewerId = identifier(accessRecord.id, 'reviewerId')
  const permissions = new Set(getEffectiveEmployeePermissions(accessUser))

  if (!permissions.has('statistics.quality.review')) {
    throw createError({ statusCode: 403, message: 'Нет права проверки качества заказов.' })
  }

  if (reviewerId === employeeId) {
    throw createError({ statusCode: 403, message: 'Сотрудник не может проверять собственный заказ.' })
  }

  let scope: ReturnType<typeof resolveEmployeeQualityScope>
  let body: ReturnType<typeof sanitizeEmployeeQualityReviewRequest>

  try {
    scope = resolveEmployeeQualityScope(accessUser, { ...getQuery(event), employee_id: employeeId })
    body = sanitizeEmployeeQualityReviewRequest(await readBody(event))
  }
  catch (error) {
    throw createError({
      statusCode: error instanceof EmployeeQualityRequestError ? error.statusCode : 400,
      message: error instanceof Error ? error.message : 'Некорректный запрос проверки качества.'
    })
  }

  if (scope.scope === 'self' || scope.employee_id !== employeeId) {
    throw createError({ statusCode: 403, message: 'Проверка заказа вне разрешённой области запрещена.' })
  }

  const binding = {
    ...scope,
    ...body,
    employee_id: employeeId,
    order_id: orderId,
    reviewer_id: reviewerId
  }
  const apiBody = toEmployeeQualityReviewApiRequest(body)
  const response = await backendRequest<unknown>(event, {
    auth: 'required',
    body: apiBody,
    method: 'PATCH',
    path: `/api/statistics/employees/${encodeURIComponent(employeeId)}/orders/${encodeURIComponent(orderId)}/review`,
    query: scope
  })

  try {
    const payload = sanitizeEmployeeQualityReviewResponse(response.data, binding)
    setResponseStatus(event, response.status)
    return payload
  }
  catch (error) {
    throw createError({
      statusCode: 502,
      message: error instanceof Error ? error.message : 'Некорректный ответ API проверки качества.'
    })
  }
})
