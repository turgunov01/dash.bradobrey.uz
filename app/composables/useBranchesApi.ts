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
    },
    getLocation(id: string) {
      return client.request<{ location: BranchLocation | null }>(`/api/branches/${id}/location`)
    },
    saveLocation(id: string, payload: BranchLocationPayload) {
      return client.request<{ location: BranchLocation }>(`/api/branches/${id}/location`, {
        body: payload,
        method: 'PUT',
        successMessage: 'Геоконтроль филиала сохранён'
      })
    },
    locationEvents(query?: Record<string, unknown>) {
      return client.request<{ items: LocationEvent[] }>('/api/barbers/location-events', {
        query: { __skipBranchScope: true, ...(query || {}) }
      })
    }
  }
}

export type BranchLocation = {
  id?: string
  branch_id: string
  latitude: number
  longitude: number
  radius_meters: number
  is_enabled: boolean
  updated_at?: string
}

export type BranchLocationPayload = Omit<BranchLocation, 'id' | 'updated_at' | 'branch_id'>

export type LocationEvent = {
  id: string
  barber_id: string
  branch_id: string
  latitude?: number | null
  longitude?: number | null
  branch_latitude?: number | null
  branch_longitude?: number | null
  radius_meters?: number | null
  barber_name?: string | null
  branch_name?: string | null
  distance_meters?: number | null
  accuracy_meters?: number | null
  measured_at?: string | null
  measuredAt?: string | null
  createdAt?: string | null
  status: 'inside_radius' | 'outside_radius' | 'rejected'
  reason?: string | null
  created_at: string
}
