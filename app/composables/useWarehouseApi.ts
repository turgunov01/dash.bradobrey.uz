type WarehouseRecord = Record<string, unknown>
type WarehouseListResponse<T = WarehouseRecord> = {
  items?: T[]
  total?: number
} | T[]

function withUnscopedQuery(query?: Record<string, unknown>) {
  return {
    __skipBranchScope: true,
    ...(query || {})
  }
}

export function useWarehouseApi() {
  const client = useApiClient()

  function list<T = WarehouseRecord>(section: 'positions' | 'purchases' | 'stocks' | 'templates', query?: Record<string, unknown>) {
    return client.request<WarehouseListResponse<T>>(`/api/warehouse/${section}`, {
      query: withUnscopedQuery(query)
    })
  }

  function create<T = WarehouseRecord>(section: 'positions' | 'purchases' | 'stocks' | 'templates', body: WarehouseRecord, message: string) {
    return client.request<T>(`/api/warehouse/${section}`, {
      body,
      method: 'POST',
      successMessage: message
    })
  }

  function patch<T = WarehouseRecord>(section: 'positions' | 'purchases' | 'templates', id: string, body: WarehouseRecord, message: string) {
    return client.request<T>(`/api/warehouse/${section}`, {
      body: { id, ...body },
      method: 'PATCH',
      successMessage: message
    })
  }

  function remove<T = WarehouseRecord>(section: 'positions' | 'purchases' | 'templates', id: string, message: string) {
    return client.request<T>(`/api/warehouse/${section}`, {
      method: 'DELETE',
      query: withUnscopedQuery({ id }),
      successMessage: message
    })
  }

  return {
    positions(query?: Record<string, unknown>) {
      return list('positions', query)
    },
    createPosition(body: WarehouseRecord) {
      return create('positions', body, 'Позиция создана')
    },
    updatePosition(id: string, body: WarehouseRecord) {
      return patch('positions', id, body, 'Позиция обновлена')
    },
    deletePosition(id: string) {
      return remove('positions', id, 'Позиция удалена')
    },

    templates(query?: Record<string, unknown>) {
      return list('templates', query)
    },
    createTemplate(body: WarehouseRecord) {
      return create('templates', body, 'Шаблон создан')
    },
    updateTemplate(id: string, body: WarehouseRecord) {
      return patch('templates', id, body, 'Шаблон обновлен')
    },
    deleteTemplate(id: string) {
      return remove('templates', id, 'Шаблон удален')
    },

    stocks(query?: Record<string, unknown>) {
      return list('stocks', query)
    },
    createStock(body: WarehouseRecord) {
      return create('stocks', body, 'Остаток создан')
    },
    saveStock(body: WarehouseRecord) {
      return client.request<WarehouseRecord>('/api/warehouse/stocks', {
        body,
        method: 'PUT',
        successMessage: 'Остаток обновлен'
      })
    },

    purchases(query?: Record<string, unknown>) {
      return list('purchases', query)
    },
    createPurchase(body: WarehouseRecord) {
      return create('purchases', body, 'Закупка создана')
    },
    updatePurchase(id: string, body: WarehouseRecord) {
      return patch('purchases', id, body, 'Закупка обновлена')
    },
    deletePurchase(id: string) {
      return remove('purchases', id, 'Закупка удалена')
    },

    summary(query?: Record<string, unknown>) {
      return client.request<WarehouseRecord>('/api/warehouse/summary', {
        query: withUnscopedQuery(query)
      })
    }
  }
}
