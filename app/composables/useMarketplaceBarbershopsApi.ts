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

type MarketplaceMerchantCreatePayload = {
  login: string
  password: string
}

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

    remove(id: string) {
      return client.request<{ deleted: boolean, id: string }>(`/api/marketplace/barbershops/${id}`, {
        method: 'DELETE',
        successMessage: 'Барбершоп удалён'
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
    },

    listMerchants(barbershopId: string) {
      return client.request<{ items?: unknown[], total?: number }>(`/api/marketplace/barbershops/${barbershopId}/merchant`, {
        query: { __skipBranchScope: true }
      })
    },

    createMerchant(barbershopId: string, payload: MarketplaceMerchantCreatePayload) {
      return client.request<{ item?: unknown }>(`/api/marketplace/barbershops/${barbershopId}/merchant`, {
        body: payload,
        method: 'POST',
        successMessage: 'Аккаунт мерчанта создан'
      })
    },

    deleteMerchant(barbershopId: string, merchantId: string) {
      // Hard delete: the merchant row is permanently removed from the backend.
      return client.request<{ deleted: boolean, id: string, item?: unknown }>(`/api/marketplace/barbershops/${barbershopId}/merchant`, {
        body: { id: merchantId },
        method: 'DELETE',
        query: { hard: true },
        successMessage: 'Аккаунт мерчанта удалён'
      })
    }
  }
}
