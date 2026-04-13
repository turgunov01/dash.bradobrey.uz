export type FinanceSnapshotResponse = {
  branch_id: string | null
  payload: unknown
  period: string
  updated_at: string | null
}

export type FinanceSnapshotUpsertPayload = {
  branch_id: string
  payload: unknown
  period: string
}

export function useFinanceApi() {
  const client = useApiClient()

  return {
    snapshot(query: { period: string }, options: { silent?: boolean } = {}) {
      return client.request<FinanceSnapshotResponse>('/api/finance', { query, silent: options.silent })
    },
    upsert(payload: FinanceSnapshotUpsertPayload) {
      return client.request<FinanceSnapshotResponse>('/api/finance', {
        body: payload,
        method: 'POST',
        successMessage: 'Финансы сохранены'
      })
    }
  }
}
