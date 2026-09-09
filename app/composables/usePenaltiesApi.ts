type PenaltyRecord = Record<string, unknown>

export function usePenaltiesApi() {
  const client = useApiClient()

  return {
    list(query?: Record<string, unknown>) {
      return client.request<{ items?: PenaltyRecord[]; data?: PenaltyRecord[]; count?: number }>('/api/penalties', { query })
    },
    create(body: PenaltyRecord) {
      return client.request<{ penalty?: PenaltyRecord }>('/api/penalties', {
        body,
        method: 'POST',
        successMessage: 'Штраф создан'
      })
    }
  }
}
