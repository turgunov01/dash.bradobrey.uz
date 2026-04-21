import type { ServiceItem } from '~~/shared/schemas'

import { fixMojibakeCp1251 } from '~/utils/text'

export type FlatServiceItem = ServiceItem & {
  category: string | null | undefined
}

type ServicesPayload =
  | { categories?: unknown[] | null, data?: unknown, services?: unknown[] | null }
  | unknown[]
  | null
  | undefined

function asCategoryName(value: unknown, fallback?: string | null) {
  const normalized = fixMojibakeCp1251(String(value || '').trim())

  return normalized || fallback || null
}

function normalizeService(service: any, fallbackCategory?: string | null): FlatServiceItem {
  const category = asCategoryName(service?.category ?? service?.category_name, fallbackCategory)
  const name = fixMojibakeCp1251(String(service?.name ?? '').trim())
  const price = service?.base_price ?? service?.price ?? 0
  const duration = service?.duration_minutes ?? service?.duration ?? 0

  return {
    ...service,
    ...(name ? { name } : {}),
    base_price: price,
    category,
    category_name: category,
    duration,
    duration_minutes: duration,
    price
  } satisfies FlatServiceItem
}

function flattenCategoryList(categories: unknown[]) {
  return categories.flatMap((category: any, index: number) => {
    const categoryName = asCategoryName(category?.name ?? category?.title ?? category?.category, `Категория ${index + 1}`)
    const services = Array.isArray(category?.services) ? category.services : []

    return services.map((service: any) => normalizeService(service, categoryName))
  })
}

export function flattenServicesPayload(payload: unknown): FlatServiceItem[] {
  const normalizedPayload = payload as ServicesPayload

  if (Array.isArray(normalizedPayload)) {
    const containsCategories = normalizedPayload.some(item => Array.isArray((item as any)?.services))

    return containsCategories
      ? flattenCategoryList(normalizedPayload)
      : normalizedPayload.map(service => normalizeService(service))
  }

  if (Array.isArray(normalizedPayload?.services)) {
    return normalizedPayload.services.map(service => normalizeService(service))
  }

  if (Array.isArray(normalizedPayload?.categories)) {
    return flattenCategoryList(normalizedPayload.categories)
  }

  if (Array.isArray((normalizedPayload as any)?.data?.services)) {
    return (normalizedPayload as any).data.services.map((service: any) => normalizeService(service))
  }

  if (Array.isArray((normalizedPayload as any)?.data?.categories)) {
    return flattenCategoryList((normalizedPayload as any).data.categories)
  }

  if (Array.isArray((normalizedPayload as any)?.data)) {
    return (normalizedPayload as any).data.map((service: any) => normalizeService(service))
  }

  return []
}
