import { createError, type H3Event } from 'h3'

type SupabaseRequestOptions = {
  body?: any
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  prefer?: string
  query?: Record<string, string | number>
}

export function getSupabaseConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  const supabaseUrl = String(config.supabaseUrl || '').trim().replace(/\/$/, '')
  const serviceRoleKey = String(config.supabaseServiceRoleKey || '').trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase is not configured.'
    })
  }

  return {
    serviceRoleKey,
    supabaseUrl
  }
}

export async function supabaseRequest(
  event: H3Event,
  table: string,
  options: SupabaseRequestOptions = {}
): Promise<any> {
  const { serviceRoleKey, supabaseUrl } = getSupabaseConfig(event)

  try {
    const data = await $fetch(`/rest/v1/${table}`, {
      baseURL: supabaseUrl,
      body: options.body,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        ...(options.prefer ? { Prefer: options.prefer } : {})
      },
      method: options.method || 'GET',
      query: options.query
    })

    return data as any
  }
  catch (error: any) {
    const payload = error?.data || error?.response?._data

    throw createError({
      data: payload,
      statusCode: error?.response?.status || 502,
      statusMessage: payload?.message || error?.message || 'Supabase request failed.'
    })
  }
}
