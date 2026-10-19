export function useHistoryApi() {
  const client = useApiClient()

  async function loadAll<T>(
    request: (query: Record<string, unknown>) => Promise<unknown>,
    query: Record<string, unknown> = {}
  ): Promise<T[]> {
    const pageSize = 500
    const seenIds = new Set<string>()
    const items: unknown[] = []

    const addItems = (pageItems: unknown[]) => {
      const newItems = pageItems.filter((item) => {
        const id = item && typeof item === 'object' ? String((item as Record<string, unknown>).id || '') : ''

        if (!id) return true
        if (seenIds.has(id)) return false
        seenIds.add(id)
        return true
      })

      items.push(...newItems)
      return newItems
    }

    const firstResponse = await request({ ...query, limit: pageSize, offset: 0 })
    const firstPageItems = extractItems(firstResponse)
    addItems(firstPageItems)
    const firstTotal = extractTotal(firstResponse)

    if (
      firstPageItems.length === 0
      || firstPageItems.length < pageSize
      || (firstTotal !== null && items.length >= firstTotal)
    ) {
      return items as T[]
    }

    let offset = firstPageItems.length
    const expectedTotal = firstTotal ?? Number.MAX_SAFE_INTEGER

    while (items.length < expectedTotal) {
      const response = await request({ ...query, limit: pageSize, offset })
      const pageItems = extractItems(response)
      const newItems = addItems(pageItems)

      if (pageItems.length < pageSize || !newItems.length) break
      offset += pageItems.length
    }

    return items as T[]
  }

  function extractItems(response: unknown): unknown[] {
    if (Array.isArray(response)) return response
    if (!response || typeof response !== 'object') return []

    const payload = response as {
      data?: unknown[] | { history?: unknown[], items?: unknown[], records?: unknown[] }
      history?: unknown[]
      items?: unknown[]
      records?: unknown[]
    }

    if (Array.isArray(payload.items)) return payload.items
    if (Array.isArray(payload.history)) return payload.history
    if (Array.isArray(payload.records)) return payload.records
    if (Array.isArray(payload.data)) return payload.data
    if (Array.isArray(payload.data?.items)) return payload.data.items
    if (Array.isArray(payload.data?.history)) return payload.data.history
    if (Array.isArray(payload.data?.records)) return payload.data.records

    return []
  }

  function extractTotal(response: unknown) {
    if (!response || typeof response !== 'object') return null

    const payload = response as { count?: unknown, total?: unknown, data?: { count?: unknown, total?: unknown } }
    const value = payload.count ?? payload.total ?? payload.data?.count ?? payload.data?.total
    const total = Number(value)

    return Number.isFinite(total) && total >= 0 ? total : null
  }

  return {
    barber(query?: Record<string, unknown>) {
      return client.request('/api/history/barber', { query })
    },
    branch(branchId: string, query?: Record<string, unknown>) {
      return client.request('/api/history/branch/', {
        query: {
          ...query,
          __skipBranchScope: true,
          id: branchId
        }
      })
    },
    list(query?: Record<string, unknown>) {
      return client.request('/api/history', { query })
    },
    async listAll<T = unknown>(query: Record<string, unknown> = {}) {
      return loadAll<T>(nextQuery => client.request('/api/history', { query: nextQuery }), query)
    },
    async branchAll<T = unknown>(branchId: string, query: Record<string, unknown> = {}) {
      return loadAll<T>(
        nextQuery => client.request('/api/history/branch/', {
          query: { ...nextQuery, __skipBranchScope: true, id: branchId }
        }),
        query
      )
    }
  }
}
