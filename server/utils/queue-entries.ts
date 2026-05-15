import type { H3Event } from 'h3'

import { supabaseRequest } from '~~/server/utils/supabase'

function toNumber(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]
}

function chunk<T>(items: T[], size: number) {
  if (size <= 0) return [items]
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

function extractServiceIds(row: any) {
  const ids: unknown[] = []

  if (row?.service_id) {
    ids.push(row.service_id)
  }

  if (Array.isArray(row?.service_ids)) {
    ids.push(...row.service_ids)
  }

  return ids
}

function computeQueueEntryAmount(row: any, basePriceByServiceId: Map<string, number>) {
  const overrideRaw = row?.price_override
  const hasOverride = overrideRaw !== undefined && overrideRaw !== null && String(overrideRaw).trim() !== ''
  const override = hasOverride ? toNumber(overrideRaw) : null

  if (override !== null) {
    return override
  }

  const serviceIds = uniqueStrings(extractServiceIds(row))
  const sum = serviceIds.reduce((acc, id) => acc + (basePriceByServiceId.get(id) ?? 0), 0)

  return sum > 0 ? sum : null
}

export async function addQueueEntryAmounts(event: H3Event, rows: any[]) {
  const items = Array.isArray(rows) ? rows : []
  const serviceIds = uniqueStrings(items.flatMap(extractServiceIds))

  const basePriceByServiceId = new Map<string, number>()

  for (const idsChunk of chunk(serviceIds, 120)) {
    if (!idsChunk.length) continue

    try {
      const services = await supabaseRequest(event, 'services', {
        method: 'GET',
        query: {
          id: `in.(${idsChunk.join(',')})`,
          select: 'id,base_price'
        }
      })

      for (const service of (Array.isArray(services) ? services : [])) {
        const id = String((service as any)?.id || '').trim()
        if (!id) continue
        basePriceByServiceId.set(id, toNumber((service as any)?.base_price))
      }
    }
    catch {
      // Best-effort: if pricing can't be loaded, still return rows without `amount`.
    }
  }

  return items.map((row) => {
    const amount = computeQueueEntryAmount(row, basePriceByServiceId)
    return { ...row, amount }
  })
}

