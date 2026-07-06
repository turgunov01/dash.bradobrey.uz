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

export type FinanceOverviewResponse = Record<string, unknown>

export function useFinanceApi() {
  const client = useApiClient()

  return {
    overview(period: string, options: { silent?: boolean } = {}) {
      return client.request<FinanceOverviewResponse>('/api/finance/overview', {
        query: { __skipBranchScope: true, period },
        silent: options.silent
      })
    },
    snapshot(query: { branch_id?: string | null, object_id?: string | null, period: string }, options: { silent?: boolean } = {}) {
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
