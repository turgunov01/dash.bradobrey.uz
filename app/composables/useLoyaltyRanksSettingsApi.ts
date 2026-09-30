export type LoyaltyRank = {
  name: string
  min_points: number
  cashback_percent: number
}

export type LoyaltyRanksSettings = {
  levels: LoyaltyRank[]
  updated_at: string | null
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
    updateSettings(levels: LoyaltyRank[]) {
      return client.request<LoyaltyRanksSettingsResponse>('/api/loyalty/ranks/settings', {
        body: { levels },
        headers: buildAuthHeaders(),
        method: 'PATCH'
      })
    }
  }
}
