import type { Branch, BranchFormPayload, BranchUpdatePayload } from '~~/shared/schemas'

type MerchantMeResponse = {
  barbershop_id: string
  user: Record<string, any>
}

type BranchListResponse = {
  items: Branch[]
  total?: number
}

export type MerchantBarber = {
  id: string
  branch_id: string | null
  name: string
  phone: string | null
  specialization: string | null
  photo_url: string | null
  is_active: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export type MerchantBarberPayload = {
  branch_id?: string | null
  is_active?: boolean | null
  name: string
  phone?: string | null
  photo_url?: string | null
  specialization?: string | null
}

export type MerchantService = {
  id: string
  name: string
  price: string | number | null
  duration_minutes: string | number | null
  category_name: string | null
  image: string | null
  is_active: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export type MerchantServicePayload = {
  category_name?: string | null
  duration_minutes?: string | number | null
  image?: string | null
  is_active?: boolean | null
  name: string
  price?: string | number | null
}

export type MerchantServiceCategory = {
  id: string
  name: string
  sort_order?: string | number | null
  is_active: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export type MerchantServiceCategoryPayload = {
  name: string
  sort_order?: string | number | null
  is_active?: boolean | null
}

export type MerchantQueueEntry = {
  id: string
  branch_id: string | null
  customer_name: string | null
  phone_number: string | null
  status: string | null
  amount: string | number | null
  payment_method: string | null
  created_at: string | null
  called_at?: string | null
  completed_at?: string | null
  updated_at?: string | null
  branches?: { name?: string | null } | null
}

type MerchantListResponse<T> = {
  items: T[]
  total?: number
}

type MerchantDashboardResponse = {
  barbershop_id: string
  counts: {
    active_orders: number
    barbers: number
    branches: number
    services: number
  }
  today: {
    completed: number
    revenue: number
  }
  active_orders: MerchantListResponse<MerchantQueueEntry>
  warnings?: string[]
}

export function useMerchantApi() {
  const client = useApiClient()

  return {
    me() {
      return client.request<MerchantMeResponse>('/api/merchant/me', {
        query: { __skipBranchScope: true }
      })
    },

    branches() {
      return client.request<BranchListResponse>('/api/merchant/branches', {
        query: { __skipBranchScope: true }
      })
    },

    createBranch(payload: BranchFormPayload) {
      const sanitized: BranchFormPayload = {
        ...payload,
        marketplace_barbershop_id: null
      }

      return client.request<{ item: Branch }>('/api/merchant/branches', {
        body: sanitized,
        method: 'POST',
        successMessage: 'Филиал создан'
      })
    },

    updateBranch(id: string, payload: BranchUpdatePayload) {
      const sanitized: BranchUpdatePayload = { ...payload }
      delete (sanitized as any).marketplace_barbershop_id

      return client.request<{ item: Branch }>(`/api/merchant/branches/${id}`, {
        body: sanitized,
        method: 'PATCH',
        successMessage: 'Филиал обновлён'
      })
    },

    deleteBranch(id: string) {
      return client.request<{ deleted: boolean, id: string }>(`/api/merchant/branches/${id}`, {
        method: 'DELETE',
        successMessage: 'Филиал удалён'
      })
    },

    dashboard() {
      return client.request<MerchantDashboardResponse>('/api/merchant/dashboard', {
        query: { __skipBranchScope: true }
      })
    },

    activeOrders(limit = 20) {
      return client.request<MerchantListResponse<MerchantQueueEntry>>('/api/merchant/orders/active', {
        query: { __skipBranchScope: true, limit }
      })
    },

    history(params: { limit?: number, from?: string, to?: string } = {}) {
      return client.request<MerchantListResponse<MerchantQueueEntry>>('/api/merchant/history', {
        query: { __skipBranchScope: true, ...params }
      })
    },

    barbers(includeInactive = true) {
      return client.request<MerchantListResponse<MerchantBarber>>('/api/merchant/barbers', {
        query: { __skipBranchScope: true, include_inactive: includeInactive }
      })
    },

    createBarber(payload: MerchantBarberPayload) {
      return client.request<{ item: MerchantBarber }>('/api/merchant/barbers', {
        body: payload,
        method: 'POST',
        successMessage: 'Барбер создан'
      })
    },

    updateBarber(id: string, payload: Partial<MerchantBarberPayload>) {
      return client.request<{ item: MerchantBarber }>(`/api/merchant/barbers/${id}`, {
        body: payload,
        method: 'PATCH',
        successMessage: 'Барбер обновлён'
      })
    },

    deleteBarber(id: string) {
      return client.request<{ deleted: boolean, id: string }>(`/api/merchant/barbers/${id}`, {
        method: 'DELETE',
        successMessage: 'Барбер удалён'
      })
    },

    services(includeInactive = true) {
      return client.request<MerchantListResponse<MerchantService>>('/api/merchant/services', {
        query: { __skipBranchScope: true, include_inactive: includeInactive }
      })
    },

    createService(payload: MerchantServicePayload) {
      return client.request<{ item: MerchantService }>('/api/merchant/services', {
        body: payload,
        method: 'POST',
        successMessage: 'Услуга создана'
      })
    },

    updateService(id: string, payload: Partial<MerchantServicePayload>) {
      return client.request<{ item: MerchantService }>(`/api/merchant/services/${id}`, {
        body: payload,
        method: 'PATCH',
        successMessage: 'Услуга обновлена'
      })
    },

    deleteService(id: string) {
      return client.request<{ deleted: boolean, id: string }>(`/api/merchant/services/${id}`, {
        method: 'DELETE',
        successMessage: 'Услуга удалена'
      })
    },

    categories(includeInactive = true) {
      return client.request<MerchantListResponse<MerchantServiceCategory>>('/api/merchant/categories', {
        query: { __skipBranchScope: true, include_inactive: includeInactive }
      })
    },

    createCategory(payload: MerchantServiceCategoryPayload) {
      return client.request<{ item: MerchantServiceCategory }>('/api/merchant/categories', {
        body: payload,
        method: 'POST',
        successMessage: 'Категория создана'
      })
    },

    updateCategory(id: string, payload: Partial<MerchantServiceCategoryPayload>) {
      return client.request<{ item: MerchantServiceCategory }>(`/api/merchant/categories/${id}`, {
        body: payload,
        method: 'PATCH',
        successMessage: 'Категория обновлена'
      })
    },

    deleteCategory(id: string) {
      return client.request<{ deleted: boolean, id: string }>(`/api/merchant/categories/${id}`, {
        method: 'DELETE',
        successMessage: 'Категория удалена'
      })
    }
  }
}
