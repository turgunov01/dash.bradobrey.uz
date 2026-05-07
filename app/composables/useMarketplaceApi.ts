type MarketplaceBarbershopPayload = {
  name: string
  city?: string | null
  address?: string | null
  timezone?: string | null
  work_hours?: unknown
  is_active?: boolean
}

export function useMarketplaceApi() {
  const client = useApiClient()
  const { authHeader } = useAdminToken()

  const baseUrl = '/api/marketplace'

  function buildAuthHeaders() {
    const header = authHeader.value
    return header ? { Authorization: header } : undefined
  }

  return {
    clients: {
      activate(id: string) {
        return client.request(`${baseUrl}/clients/${id}/activate`, {
          headers: buildAuthHeaders(),
          method: 'POST',
          successMessage: 'Клиент активирован'
        })
      },
      deactivate(id: string) {
        return client.request(`${baseUrl}/clients/${id}/deactivate`, {
          headers: buildAuthHeaders(),
          method: 'POST',
          successMessage: 'Клиент деактивирован'
        })
      },
      detail(id: string) {
        return client.request(`${baseUrl}/clients/${id}`, {
          headers: buildAuthHeaders(),
          query: { __skipBranchScope: true }
        })
      },
      list(options: { active?: boolean | null, limit?: number, offset?: number, q?: string } = {}) {
        const query: Record<string, unknown> = { __skipBranchScope: true }

        if (typeof options.active === 'boolean') {
          query.active = options.active
        }

        if (typeof options.limit === 'number') {
          query.limit = options.limit
        }

        if (typeof options.offset === 'number') {
          query.offset = options.offset
        }

        const queryText = String(options.q || '').trim()
        if (queryText) {
          query.q = queryText
        }

        return client.request(`${baseUrl}/clients`, {
          headers: buildAuthHeaders(),
          query
        })
      }
    },
    banners: {
      create(body: FormData) {
        return client.request(`${baseUrl}/banners`, {
          body,
          headers: buildAuthHeaders(),
          method: 'POST',
          successMessage: 'Баннер создан'
        })
      },
      detail(id: string) {
        return client.request(`${baseUrl}/banners/${id}`, {
          headers: buildAuthHeaders(),
          query: { __skipBranchScope: true }
        })
      },
      list() {
        return client.request(`${baseUrl}/banners`, {
          headers: buildAuthHeaders(),
          query: { __skipBranchScope: true }
        })
      },
      toggleActive(id: string, isActive: boolean) {
        return client.request(`${baseUrl}/banners/${id}`, {
          body: { is_active: isActive },
          headers: buildAuthHeaders(),
          method: 'DELETE',
          successMessage: isActive ? 'Баннер активирован' : 'Баннер скрыт'
        })
      },
      update(id: string, body: FormData) {
        return client.request(`${baseUrl}/banners/${id}`, {
          body,
          headers: buildAuthHeaders(),
          method: 'PUT',
          successMessage: 'Баннер обновлён'
        })
      }
    },
    barbershops: {
      activate(id: string) {
        return client.request(`${baseUrl}/barbershops/${id}/activate`, {
          headers: buildAuthHeaders(),
          method: 'POST',
          successMessage: 'Барбершоп активирован'
        })
      },
      create(body: MarketplaceBarbershopPayload) {
        return client.request(`${baseUrl}/barbershops`, {
          body,
          headers: buildAuthHeaders(),
          method: 'POST',
          successMessage: 'Барбершоп создан'
        })
      },
      deactivate(id: string) {
        return client.request(`${baseUrl}/barbershops/${id}/deactivate`, {
          headers: buildAuthHeaders(),
          method: 'POST',
          successMessage: 'Барбершоп деактивирован'
        })
      },
      list(options: { active?: boolean | null } = {}) {
        const query: Record<string, unknown> = { __skipBranchScope: true }

        if (typeof options.active === 'boolean') {
          query.active = options.active
        }

        return client.request(`${baseUrl}/barbershops`, {
          headers: buildAuthHeaders(),
          query
        })
      },
      update(id: string, body: Partial<MarketplaceBarbershopPayload>) {
        return client.request(`${baseUrl}/barbershops/${id}`, {
          body,
          headers: buildAuthHeaders(),
          method: 'PATCH',
          successMessage: 'Барбершоп обновлён'
        })
      }
    }
  }
}
