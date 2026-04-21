import type { Branch, BranchFormPayload, BranchUpdatePayload } from '~~/shared/schemas'

type BranchListResponse = {
  items: Branch[]
  total?: number
}

export function useBranchesApi() {
  const client = useApiClient()

  return {
    create(payload: BranchFormPayload) {
      return client.request<{ item: Branch }>('/api/branches', {
        body: payload,
        method: 'POST',
        successMessage: 'Филиал создан'
      })
    },
    list(query?: Record<string, unknown>) {
      return client.request<BranchListResponse>('/api/branches', {
        query: {
          __skipBranchScope: true,
          ...(query || {})
        }
      })
    },
    remove(id: string, options: { force?: boolean, silent?: boolean } = {}) {
      return client.request<{ deleted: boolean, id: string }>(`/api/branches/${id}`, {
        method: 'DELETE',
        ...(options.force ? { query: { force: true } } : {}),
        ...(options.silent ? { silent: true } : {}),
        successMessage: 'Филиал удалён'
      })
    },
    update(id: string, payload: BranchUpdatePayload) {
      return client.request<{ item: Branch }>(`/api/branches/${id}`, {
        body: payload,
        method: 'PATCH',
        successMessage: 'Филиал обновлён'
      })
    }
  }
}
