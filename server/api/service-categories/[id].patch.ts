import { createError, readBody } from 'h3'
import { z } from 'zod'

import { backendRequest } from '~~/server/utils/backend'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

const payloadSchema = z.object({
  is_active: z.boolean().optional().nullable(),
  name: z.string().trim().min(1).optional(),
  sort_order: z.union([z.string(), z.number()]).optional().nullable()
}).refine(
  value => Object.keys(value).length > 0,
  { message: 'Нет данных для обновления категории' }
)

function requireId(value: unknown) {
  const id = String(value || '').trim()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Не указан id категории.'
    })
  }

  return id
}

function getSupabaseErrorPayload(error: any) {
  return error?.data || error?.response?._data || null
}

function isMissingServiceCategoriesTableError(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || error?.code || '').trim()
  const message = [payload?.message, payload?.details, error?.message].filter(Boolean).join(' ')

  return code === '42P01'
    || code === 'PGRST205'
    || (/service_categories/i.test(message) && /does not exist|not found|schema cache/i.test(message))
}

function isUniqueViolation(error: any) {
  const payload = getSupabaseErrorPayload(error)
  const code = String(payload?.code || '').trim()
  return code === '23505'
}

function toIntegerOrNull(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  const num = Number.parseInt(String(value), 10)
  return Number.isFinite(num) ? num : null
}

function normalizeText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

function withFallbackCategory(service: any, fallbackCategory: string | null) {
  if (!service || typeof service !== 'object') return service

  const category = service?.category ?? service?.category_name ?? fallbackCategory

  return {
    ...service,
    category,
    category_name: service?.category_name ?? category
  }
}

function extractServices(payload: any): any[] {
  if (Array.isArray(payload)) {
    const containsCategories = payload.some(item => Array.isArray(item?.services))
    return containsCategories
      ? payload.flatMap((item) => {
          const fallbackCategory = normalizeText(item?.name ?? item?.title ?? item?.category)
          return Array.isArray(item?.services)
            ? item.services.map((service: any) => withFallbackCategory(service, fallbackCategory))
            : []
        })
      : payload
  }

  if (!payload || typeof payload !== 'object') return []
  if (Array.isArray(payload.services)) return payload.services
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.data)) return extractServices(payload.data)
  if (Array.isArray(payload.categories)) {
    return payload.categories.flatMap((category: any) => {
      const fallbackCategory = normalizeText(category?.name ?? category?.title ?? category?.category)
      return Array.isArray(category?.services)
        ? category.services.map((service: any) => withFallbackCategory(service, fallbackCategory))
        : []
    })
  }
  if (payload.data && typeof payload.data === 'object') return extractServices(payload.data)

  return []
}

function serviceCategoryName(service: any) {
  return normalizeText(service?.category ?? service?.category_name)
}

async function updateServicesCategory(event: any, branchId: string, previousName: string, nextName: string) {
  const response = await backendRequest<unknown>(event, {
    auth: 'none',
    method: 'GET',
    path: '/api/services',
    query: {
      branch_id: branchId,
      object_id: branchId
    }
  })

  const matchingServices = extractServices(response.data).filter(service => serviceCategoryName(service) === previousName)

  await Promise.all(matchingServices.flatMap((service) => {
    const id = normalizeText(service?.id)
    if (!id) return []

    return backendRequest<unknown>(event, {
      auth: 'none',
      body: {
        category: nextName,
        category_name: nextName
      },
      method: 'PATCH',
      path: `/api/services/${id}`
    })
  }))
}

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const id = requireId(event.context.params?.id)
  const payload = payloadSchema.parse(await readBody(event))
  const sortOrder = payload.sort_order === undefined ? undefined : toIntegerOrNull(payload.sort_order)

  try {
    const existing = await supabaseRequest(event, 'service_categories', {
      method: 'GET',
      query: {
        id: `eq.${id}`,
        select: 'id,branch_id,name'
      }
    })

    const existingItem = Array.isArray(existing) ? existing[0] : null

    if (!existingItem) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Категория не найдена.'
      })
    }

    const previousName = normalizeText((existingItem as any).name)
    const branchId = normalizeText((existingItem as any).branch_id)

    const rows = await supabaseRequest(event, 'service_categories', {
      body: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
        ...(sortOrder !== undefined && sortOrder !== null ? { sort_order: sortOrder } : {})
      },
      method: 'PATCH',
      prefer: 'return=representation',
      query: {
        id: `eq.${id}`,
        select: 'id,branch_id,name,sort_order,is_active,created_at,updated_at'
      }
    })

    const item = Array.isArray(rows) ? rows[0] : null

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Категория не найдена.'
      })
    }

    const nextName = normalizeText((item as any).name)

    if (payload.name !== undefined && branchId && previousName && nextName && previousName !== nextName) {
      await updateServicesCategory(event, branchId, previousName, nextName)
    }

    return { item }
  }
  catch (error: any) {
    if (isMissingServiceCategoriesTableError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет таблицы service_categories. Примените SQL-миграцию scripts/supabase/2026-05-16_create_service_categories.sql.'
      })
    }

    if (isUniqueViolation(error)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Категория с таким названием уже существует в этом филиале.'
      })
    }

    throw error
  }
})
