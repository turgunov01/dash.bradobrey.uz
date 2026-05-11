type MarketplaceListResponse<TItem = unknown> = {
  count?: number
  items?: TItem[]
  setup_required?: boolean
}

type MarketplaceItemResponse<TItem = unknown> = {
  item?: TItem
}

export type DashboardMarketplaceAvailabilityQuery = {
  barber_id: string
  date?: string
  service_ids?: string[] | string
}

export function useDashboardMarketplaceApi() {
  const client = useApiClient()

  return {
    fetchBarbershops(city?: string, options: { active?: boolean } = {}) {
      return client.request<MarketplaceListResponse>('/api/marketplace/catalog/barbershops', {
        query: {
          __skipBranchScope: true,
          ...(city ? { city } : {}),
          ...(options.active === undefined ? {} : { active: options.active })
        }
      })
    },

    fetchBarbershop(id: string) {
      return client.request<MarketplaceItemResponse>(`/api/marketplace/catalog/barbershops/${id}`, {
        query: { __skipBranchScope: true }
      })
    },

    fetchBranches(barbershopId: string, options: { active?: boolean } = {}) {
      return client.request<MarketplaceListResponse>(`/api/marketplace/catalog/barbershops/${barbershopId}/branches`, {
        query: {
          __skipBranchScope: true,
          ...(options.active === undefined ? {} : { active: options.active })
        }
      })
    },

    fetchBranch(id: string) {
      return client.request<Record<string, unknown>>(`/api/marketplace/catalog/branches/${id}`, {
        query: { __skipBranchScope: true }
      })
    },

    fetchAvailability(branchId: string, query: DashboardMarketplaceAvailabilityQuery) {
      const serviceIds = Array.isArray(query.service_ids)
        ? query.service_ids.filter(Boolean).join(',')
        : query.service_ids

      return client.request<Record<string, unknown>>(`/api/marketplace/catalog/branches/${branchId}/availability`, {
        query: {
          __skipBranchScope: true,
          barber_id: query.barber_id,
          ...(query.date ? { date: query.date } : {}),
          ...(serviceIds ? { service_ids: serviceIds } : {})
        }
      })
    }
  }
}

