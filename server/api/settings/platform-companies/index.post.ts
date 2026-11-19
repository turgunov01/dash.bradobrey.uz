import { readBody, setResponseStatus } from 'h3'

import { backendRequest } from '~~/server/utils/backend'
import { pickFields } from '~~/server/utils/platform-session'

const CREATE_FIELDS = ['name', 'code', 'currency', 'timezone', 'logo_url', 'primary_color'] as const

export default defineEventHandler(async (event) => {
  const response = await backendRequest(event, {
    auth: 'required',
    body: pickFields(await readBody(event).catch(() => ({})), CREATE_FIELDS),
    method: 'POST',
    path: '/api/platform/companies'
  })
  setResponseStatus(event, response.status)
  return response.data
})
