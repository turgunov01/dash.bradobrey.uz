import { getQuery } from 'h3'

import { ensureMerchantAccess } from '~~/server/utils/merchant-access'
import { addQueueEntryAmounts } from '~~/server/utils/queue-entries'
import { supabaseRequest } from '~~/server/utils/supabase'

function toInteger(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]
}

function normalizeIso(value: unknown) {
  const text = String(value || '').trim()
  return text ? text : null
}

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)
  const query = getQuery(event)

  const limit = Math.min(200, Math.max(1, toInteger((query as any).limit, 50)))
  const from = normalizeIso((query as any).from)
  const to = normalizeIso((query as any).to)

  const branches = await supabaseRequest(event, 'branches', {
    method: 'GET',
    query: {
      marketplace_barbershop_id: `eq.${access.barbershopId}`,
      select: 'id'
    }
  })

  const branchIds = uniqueStrings(Array.isArray(branches) ? branches.map((row: any) => row?.id) : [])

  if (!branchIds.length) {
    return { items: [], total: 0 }
  }

  const rows = await supabaseRequest(event, 'queue_entries', {
    method: 'GET',
    query: {
      branch_id: `in.(${branchIds.join(',')})`,
      status: 'not.in.("pending","waiting","called","started","in_progress")',
      ...(from ? { created_at: `gte.${from}` } : {}),
      ...(to ? { created_at: `lte.${to}` } : {}),
      order: 'created_at.desc.nullslast',
      limit,
      select: 'id,branch_id,client_id,status,payment_method,price_override,price_override_reason,service_id,service_ids,created_at,updated_at,...clients(customer_name:name,phone_number:phone),branches(name)'
    }
  })

  const items = await addQueueEntryAmounts(event, Array.isArray(rows) ? rows : [])

  return {
    items,
    total: items.length
  }
})
