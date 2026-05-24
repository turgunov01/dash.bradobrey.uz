import type {
  PromoCreatePayload,
  PromoUsePayload,
  PromoValidatePayload
} from '~~/shared/schemas'

export function usePromoApi() {
  const client = useApiClient()

  return {
    create(payload: PromoCreatePayload) {
      return client.request('/api/promo-code/dashboard/create', {
        body: payload,
        method: 'POST',
        successMessage: 'Промокод создан'
      })
    },
    dashboard(query?: Record<string, unknown>) {
      return client.request('/api/promo-code/dashboard', { query })
    },
    detail(id: string) {
      return client.request(`/api/promo-code/dashboard/${id}`)
    },
    remove(id: string) {
      return client.request(`/api/promo-code/dashboard/${id}`, {
        method: 'DELETE',
        successMessage: 'Промокод удален'
      })
    },
    update(id: string, payload: PromoCreatePayload) {
      return client.request(`/api/promo-code/dashboard/${id}`, {
        body: payload,
        method: 'PATCH',
        successMessage: 'Промокод обновлен'
      })
    },
    use(payload: PromoUsePayload) {
      return client.request('/api/promo-code/use', {
        body: payload,
        method: 'POST',
        successMessage: 'Использование промокода зафиксировано'
      })
    },
    validate(payload: PromoValidatePayload) {
      return client.request('/api/promo-code/validate', {
        body: payload,
        method: 'POST',
        successMessage: 'Промокод проверен'
      })
    }
  }
}
