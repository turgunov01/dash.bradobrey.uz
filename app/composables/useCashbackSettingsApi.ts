export type CashbackSettings = {
  default_percent: number
  promotion_percent: number | null
  promotion_start_date: string | null
  promotion_end_date: string | null
  timezone: string
  updated_at?: string | null
}

type CashbackSettingsResponse = {
  settings: Array<{ key: string, value: CashbackSettings, updated_at?: string | null }>
}

export function useCashbackSettingsApi() {
  const client = useApiClient()
  const { authHeader } = useAdminToken()

  const headers = () => authHeader.value ? { Authorization: authHeader.value } : undefined

  return {
    async getSettings() {
      const response = await client.request<CashbackSettingsResponse>('/api/marketplace/admin/settings', {
        headers: headers(),
        query: { __skipBranchScope: true }
      })
      const item = response.settings?.find(setting => setting.key === 'cashback')
      return item?.value || {
        default_percent: 1,
        promotion_percent: null,
        promotion_start_date: null,
        promotion_end_date: null,
        timezone: 'Asia/Tashkent'
      }
    },
    updateSettings(value: CashbackSettings) {
      return client.request<{ setting: { value: CashbackSettings, updated_at?: string | null } }>(
        '/api/marketplace/admin/settings/cashback',
        {
          body: { value },
          headers: headers(),
          method: 'PATCH',
          query: { __skipBranchScope: true }
        }
      )
    }
  }
}
