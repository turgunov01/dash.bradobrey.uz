import { createError, getQuery, setResponseStatus } from 'h3'

import {
  assertEmployeeQualityResponseBinding,
  EmployeeQualityRequestError,
  resolveEmployeeQualityScope,
  sanitizeEmployeeQualityResponse,
  validateEmployeeQualityDateRange,
  validateEmployeeQualityPagination
} from '~~/shared/statistics/employee-quality'
import { backendRequest } from '~~/server/utils/backend'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'

function requestError(error: unknown) {
  throw createError({
    statusCode: error instanceof EmployeeQualityRequestError ? error.statusCode : 400,
    message: error instanceof Error ? error.message : 'Некорректный запрос рейтинга сотрудников.'
  })
}

export default defineEventHandler(async (event) => {
  const accessUser = await ensureDashboardAccess(event)
  const query = getQuery(event)
  let range: ReturnType<typeof validateEmployeeQualityDateRange>
  let pagination: ReturnType<typeof validateEmployeeQualityPagination>
  let scope: ReturnType<typeof resolveEmployeeQualityScope>

  try {
    range = validateEmployeeQualityDateRange(query.start_date, query.end_date)
    pagination = validateEmployeeQualityPagination(query.cursor, query.limit)
    scope = resolveEmployeeQualityScope(accessUser, query)
  }
  catch (error) {
    return requestError(error)
  }

  const response = await backendRequest<unknown>(event, {
    auth: 'required',
    method: 'GET',
    path: '/api/statistics/employees',
    query: {
      ...range,
      ...pagination,
      ...scope
    }
  })

  let payload

  try {
    // Rebuild the response from the documented aggregate fields. This keeps
    // accidental client PII additions from crossing the Dashboard BFF.
    payload = assertEmployeeQualityResponseBinding(
      sanitizeEmployeeQualityResponse(response.data),
      {
        ...range,
        ...scope
      }
    )
  }
  catch (error) {
    throw createError({
      statusCode: 502,
      message: error instanceof Error ? error.message : 'Некорректный ответ API рейтинга сотрудников.'
    })
  }

  setResponseStatus(event, response.status)
  return payload
})
