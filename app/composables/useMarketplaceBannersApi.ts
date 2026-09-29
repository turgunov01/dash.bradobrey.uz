export type MarketplaceBanner = {
  id: string
  locales?: {
    title?: Record<string, string>
    description?: Record<string, string>
  }
  media?: { type?: string | null, url?: string | null }
  is_active?: boolean | null
  sort_order?: number | null
}

type BannerListResponse = { data?: MarketplaceBanner[] }
type BannerEntryResponse = { entry?: MarketplaceBanner }

export function useMarketplaceBannersApi() {
  const client = useApiClient()
  const { authHeader } = useAdminToken()

  function headers() {
    return authHeader.value ? { Authorization: authHeader.value } : undefined
  }

  return {
    list() {
      return client.request<BannerListResponse>('/api/marketplace/banners', {
        headers: headers(),
        query: { __skipBranchScope: true }
      })
    },
    create(body: FormData) {
      return client.request<BannerEntryResponse>('/api/marketplace/banners', {
        body,
        headers: headers(),
        method: 'POST',
        query: { __skipBranchScope: true }
      })
    },
    update(id: string, body: FormData) {
      return client.request<BannerEntryResponse>(`/api/marketplace/banners/${id}`, {
        body,
        headers: headers(),
        method: 'PATCH',
        query: { __skipBranchScope: true }
      })
    },
    remove(id: string) {
      return client.request<BannerEntryResponse>(`/api/marketplace/banners/${id}`, {
        headers: headers(),
        method: 'DELETE',
        query: { __skipBranchScope: true }
      })
    }
  }
}
