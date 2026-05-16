import type { ServiceCategory, ServiceCategoryFormPayload, ServiceCategoryUpdatePayload } from '~~/shared/schemas'

type ServiceCategoryListResponse = {
  items: ServiceCategory[]
  total?: number
}

export function useServiceCategoriesApi() {
  const client = useApiClient()

  return {
    create(payload: ServiceCategoryFormPayload) {
      return client.request<{ item: ServiceCategory }>('/api/service-categories', {
        body: payload,
        method: 'POST',
        successMessage: 'Категория создана'
      })
    },
    list(includeInactive = true) {
      return client.request<ServiceCategoryListResponse>('/api/service-categories', {
        query: { include_inactive: includeInactive }
      })
    },
    remove(id: string) {
      return client.request<{ deleted: boolean, id: string }>(`/api/service-categories/${id}`, {
        method: 'DELETE',
        successMessage: 'Категория удалена'
      })
    },
    update(id: string, payload: ServiceCategoryUpdatePayload) {
      return client.request<{ item: ServiceCategory }>(`/api/service-categories/${id}`, {
        body: payload,
        method: 'PATCH',
        successMessage: 'Категория обновлена'
      })
    }
  }
}
