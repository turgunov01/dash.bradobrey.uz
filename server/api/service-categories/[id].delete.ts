import { createError } from 'h3'

import { backendRequest } from '~~/server/utils/backend'
import { ensureDashboardAccess } from '~~/server/utils/dashboard-access'
import { supabaseRequest } from '~~/server/utils/supabase'

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

async function categoryHasServices(event: any, branchId: string, categoryName: string) {
  const response = await backendRequest<unknown>(event, {
    auth: 'none',
    method: 'GET',
    path: '/api/services',
    query: {
      branch_id: branchId,
      object_id: branchId
    }
  })

  return extractServices(response.data).some(service => serviceCategoryName(service) === categoryName)
}

export default defineEventHandler(async (event) => {
  await ensureDashboardAccess(event)

  const id = requireId(event.context.params?.id)

  try {
    const existing = await supabaseRequest(event, 'service_categories', {
      method: 'GET',
      query: {
        id: `eq.${id}`,
        select: 'id,branch_id,name'
      }
    })

    const category = Array.isArray(existing) ? existing[0] : null

    if (!category) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Категория не найдена.'
      })
    }

    const branchId = normalizeText((category as any).branch_id)
    const categoryName = normalizeText((category as any).name)

    if (branchId && categoryName && await categoryHasServices(event, branchId, categoryName)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Нельзя удалить категорию: в ней есть услуги. Сначала перенесите или удалите услуги.'
      })
    }

    const rows = await supabaseRequest(event, 'service_categories', {
      method: 'DELETE',
      prefer: 'return=representation',
      query: {
        id: `eq.${id}`,
        select: 'id'
      }
    })

    const item = Array.isArray(rows) ? rows[0] : null

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Категория не найдена.'
      })
    }

    return {
      deleted: true,
      id: String((item as any).id)
    }
  }
  catch (error: any) {
    if (isMissingServiceCategoriesTableError(error)) {
      throw createError({
        data: getSupabaseErrorPayload(error),
        statusCode: 501,
        statusMessage: 'В Supabase нет таблицы service_categories. Примените SQL-миграцию scripts/supabase/2026-05-16_create_service_categories.sql.'
      })
    }

    throw error
  }
})
