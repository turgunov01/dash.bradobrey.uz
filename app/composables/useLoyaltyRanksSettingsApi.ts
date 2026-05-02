export type LoyaltyRanksSettings = {
  id: string
  bronze_min_visits: number
  silver_min_visits: number
  gold_min_visits: number
  updated_at: string
}

type LoyaltyRanksSettingsResponse = {
  settings: LoyaltyRanksSettings
}

export function useLoyaltyRanksSettingsApi() {
  const client = useApiClient()
  const { authHeader } = useAdminToken()

  function buildAuthHeaders() {
    const header = authHeader.value
    return header ? { Authorization: header } : undefined
  }

  return {
    getSettings() {
      return client.request<LoyaltyRanksSettingsResponse>('/api/loyalty/ranks/settings', {
        headers: buildAuthHeaders(),
        query: { __skipBranchScope: true }
      })
    },
    updateSettings(body: { bronze_min_visits?: number, silver_min_visits?: number, gold_min_visits?: number }) {
      return client.request<LoyaltyRanksSettingsResponse>('/api/loyalty/ranks/settings', {
        body,
        headers: buildAuthHeaders(),
        method: 'PATCH'
      })
    }
  }
}

