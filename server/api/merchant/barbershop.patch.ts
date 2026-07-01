import { readBody, setResponseStatus } from 'h3'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { backendRequest } from '~~/server/utils/backend'

const allowedFields = [
  'address',
  'city',
  'cover_url',
  'description',
  'is_active',
  'logo_url',
  'metadata',
  'name',
  'sort_order',
  'timezone',
  'work_hours'
] as const

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)
  const body: Record<string, unknown> = await readBody<Record<string, unknown>>(event).catch(() => ({}))
  const payload: Record<string, unknown> = {}

  for (const field of allowedFields) {
    if (body && Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field]
    }
  }

  const response = await backendRequest<unknown>(event, {
    auth: 'required',
    body: payload,
    method: 'PATCH',
    path: `/api/marketplace/barbershops/${access.barbershopId}`
  })

  setResponseStatus(event, response.status)

  return response.data
})
