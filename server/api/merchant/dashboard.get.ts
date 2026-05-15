import { getQuery } from 'h3'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { addQueueEntryAmounts } from '~~/server/utils/queue-entries'
import { supabaseRequest } from '~~/server/utils/supabase'

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function isMissingTableError(error: any, table: string) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (new RegExp(table, 'i').test(message) && /does not exist|not found|schema cache/i.test(message))
}

function toInteger(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]
}

function toNumber(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)
  const query = getQuery(event)
  const activeLimit = Math.min(50, Math.max(1, toInteger((query as any).active_limit ?? (query as any).activeLimit, 10)))

  const branches = await supabaseRequest(event, 'branches', {
    method: 'GET',
    query: {
      marketplace_barbershop_id: `eq.${access.barbershopId}`,
      order: 'name.asc.nullslast',
      select: 'id,name,is_active'
    }
  })

  const branchItems = Array.isArray(branches) ? branches : []
  const branchIds = uniqueStrings(branchItems.map((row: any) => row?.id))

  const warnings: string[] = []

  const [barbersResult, servicesResult] = await Promise.allSettled([
    supabaseRequest(event, 'marketplace_barbers', {
      method: 'GET',
      query: {
        marketplace_barbershop_id: `eq.${access.barbershopId}`,
        select: 'id'
      }
    }),
    supabaseRequest(event, 'marketplace_services', {
      method: 'GET',
      query: {
        marketplace_barbershop_id: `eq.${access.barbershopId}`,
        select: 'id'
      }
    })
  ])

  const barbersCount = barbersResult.status === 'fulfilled'
    ? (Array.isArray(barbersResult.value) ? barbersResult.value.length : 0)
    : (() => {
        if (isMissingTableError(barbersResult.reason, 'marketplace_barbers')) {
          warnings.push('Missing table marketplace_barbers')
          return 0
        }
        throw barbersResult.reason
      })()

  const servicesCount = servicesResult.status === 'fulfilled'
    ? (Array.isArray(servicesResult.value) ? servicesResult.value.length : 0)
    : (() => {
        if (isMissingTableError(servicesResult.reason, 'marketplace_services')) {
          warnings.push('Missing table marketplace_services')
          return 0
        }
        throw servicesResult.reason
      })()

  const activeOrders = branchIds.length
    ? await supabaseRequest(event, 'queue_entries', {
        method: 'GET',
        query: {
          branch_id: `in.(${branchIds.join(',')})`,
          status: 'in.("pending","waiting","called","started","in_progress")',
          order: 'created_at.desc.nullslast',
          limit: activeLimit,
          select: 'id,branch_id,client_id,status,payment_method,price_override,price_override_reason,service_id,service_ids,created_at,updated_at,...clients(customer_name:name,phone_number:phone),branches(name)'
        }
      })
    : []

  const activeItems = await addQueueEntryAmounts(event, Array.isArray(activeOrders) ? activeOrders : [])

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const startIso = startOfDay.toISOString()

  const todayCompleted = branchIds.length
    ? await supabaseRequest(event, 'queue_entries', {
        method: 'GET',
        query: {
          branch_id: `in.(${branchIds.join(',')})`,
          created_at: `gte.${startIso}`,
          status: 'in.("completed","done","paid")',
          select: 'id,service_id,service_ids,price_override'
        }
      })
    : []

  const todayItems = await addQueueEntryAmounts(event, Array.isArray(todayCompleted) ? todayCompleted : [])
  const todayRevenue = todayItems.reduce((sum: number, item: any) => sum + toNumber(item?.amount), 0)

  return {
    barbershop_id: access.barbershopId,
    counts: {
      active_orders: activeItems.length,
      barbers: barbersCount,
      branches: branchItems.length,
      services: servicesCount
    },
    today: {
      completed: todayItems.length,
      revenue: todayRevenue
    },
    active_orders: {
      items: activeItems,
      total: activeItems.length
    },
    warnings
  }
})
