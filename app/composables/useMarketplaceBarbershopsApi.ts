type MarketplaceBarbershopPayload = {
  address?: string | null
  city?: string | null
  cover_url?: string | null
  description?: string | null
  is_active?: boolean
  logo_url?: string | null
  metadata?: Record<string, unknown> | null
  name: string
  sort_order?: number
  timezone?: string | null
  work_hours?: Record<string, unknown> | null
}

type MarketplaceBarbershopUpdatePayload = Partial<MarketplaceBarbershopPayload>

export function useMarketplaceBarbershopsApi() {
  const client = useApiClient()

  return {
    list(query?: Record<string, unknown>) {
      return client.request<{ data?: unknown[] }>('/api/marketplace/barbershops', {
        query: {
          __skipBranchScope: true,
          ...(query || {})
        }
      })
    },

    getById(id: string) {
      return client.request<{ entry?: unknown }>(`/api/marketplace/barbershops/${id}`, {
        query: { __skipBranchScope: true }
      })
    },

    create(payload: MarketplaceBarbershopPayload) {
      return client.request<{ entry?: unknown }>('/api/marketplace/barbershops', {
        body: payload,
        method: 'POST',
        successMessage: 'Барбершоп добавлен'
      })
    },

    update(id: string, payload: MarketplaceBarbershopUpdatePayload) {
      return client.request<{ entry?: unknown }>(`/api/marketplace/barbershops/${id}`, {
        body: payload,
        method: 'PATCH',
        successMessage: 'Барбершоп обновлён'
      })
    },

    activate(id: string) {
      return client.request<{ entry?: unknown }>(`/api/marketplace/barbershops/${id}/activate`, {
        method: 'POST',
        successMessage: 'Барбершоп активирован'
      })
    },

    deactivate(id: string) {
      return client.request<{ entry?: unknown }>(`/api/marketplace/barbershops/${id}/deactivate`, {
        method: 'POST',
        successMessage: 'Барбершоп деактивирован'
      })
    }
  }
}
