import type { ServiceFormPayload } from '~~/shared/schemas'

export function useServicesApi() {
  const client = useApiClient()

  const mapPayload = (payload: ServiceFormPayload) => ({
    base_price: payload.price ?? null,
    category: payload.category_name ?? null,
    duration_minutes: payload.duration ?? null,
    image: payload.image || undefined,
    is_active: payload.is_active,
    name: payload.name
  })

  return {
    create(payload: ServiceFormPayload | FormData) {
      const body = payload instanceof FormData ? payload : mapPayload(payload)
      return client.request('/api/services', { body, method: 'POST', successMessage: 'Услуга создана' })
    },
    detail(id: string) {
      return client.request(`/api/services/${id}`)
    },
    list() {
      return client.request('/api/services')
    },
    remove(id: string, query?: Record<string, unknown>) {
      return client.request(`/api/services/${id}`, { method: 'DELETE', query, successMessage: 'Услуга удалена' })
    },
    update(id: string, payload: Partial<ServiceFormPayload> | FormData) {
      const body = payload instanceof FormData ? payload : mapPayload(payload as ServiceFormPayload)
      return client.request(`/api/services/${id}`, { body, method: 'PATCH', successMessage: 'Услуга обновлена' })
    }
  }
}
