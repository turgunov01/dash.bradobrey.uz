export type KioskAdsSettings = {
  id: string
  regular_urls: string[]
  kids_urls: string[]
  updated_at: string
}

type KioskAdsSettingsResponse = {
  settings: KioskAdsSettings
}

export function useKioskAdsSettingsApi() {
  const client = useApiClient()
  const { authHeader } = useAdminToken()

  function buildAuthHeaders() {
    const header = authHeader.value
    return header ? { Authorization: header } : undefined
  }

  return {
    getSettings() {
      return client.request<KioskAdsSettingsResponse>('/api/kiosk-ads/settings', {
        headers: buildAuthHeaders(),
        query: { __skipBranchScope: true }
      })
    },
    updateSettings(body: { regular_urls?: string[], kids_urls?: string[] }) {
      return client.request<KioskAdsSettingsResponse>('/api/kiosk-ads/settings', {
        body,
        headers: buildAuthHeaders(),
        method: 'PATCH'
      })
    }
  }
}

