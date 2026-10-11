export type NoShowRestrictionSettings = {
  enabled: boolean
  automatic: boolean
  first_violation_minutes: number
  second_violation_minutes: number
  third_plus_violation_minutes: number
  lookback_days: number
  updated_at?: string | null
}

type SettingsResponse = {
  settings: Array<{ key: string, value: NoShowRestrictionSettings, updated_at?: string | null }>
}

const defaults: NoShowRestrictionSettings = {
  enabled: true,
  automatic: true,
  first_violation_minutes: 1440,
  second_violation_minutes: 4320,
  third_plus_violation_minutes: 10080,
  lookback_days: 365
}

export function useNoShowRestrictionSettingsApi() {
  const client = useApiClient()
  return {
    async getSettings() {
      const response = await client.request<SettingsResponse>('/api/marketplace/admin/settings', {
        query: { __skipBranchScope: true },
        skipAuth: true
      })
      const item = response.settings?.find(setting => setting.key === 'no_show_restrictions')
      return {
        settings: { ...defaults, ...(item?.value || {}) },
        updated_at: item?.updated_at || item?.value?.updated_at || null
      }
    },
    updateSettings(value: NoShowRestrictionSettings) {
      const payload = {
        enabled: Boolean(value.enabled),
        automatic: Boolean(value.automatic),
        first_violation_minutes: Number(value.first_violation_minutes),
        second_violation_minutes: Number(value.second_violation_minutes),
        third_plus_violation_minutes: Number(value.third_plus_violation_minutes),
        lookback_days: Number(value.lookback_days)
      }
      return client.request<{ setting: { value: NoShowRestrictionSettings, updated_at?: string | null } }>(
        '/api/marketplace/admin/settings/no_show_restrictions',
        { body: { value: payload }, method: 'PATCH', query: { __skipBranchScope: true }, skipAuth: true }
      )
    }
  }
}
