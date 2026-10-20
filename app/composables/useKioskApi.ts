import type {
  KioskBookingPayload,
  KioskRegisterPayload
} from '~~/shared/schemas'

export interface KioskDevice {
  id: string
  branch_id: string
  branch_name: string | null
  device_name: string
  has_device_token: boolean
  created_at: string
  updated_at: string
}

export function useKioskApi() {
  const client = useApiClient()

  return {
    // Scoped to the active branch by useApiClient; all branches when none is active.
    devices() {
      return client.request<{ entry: KioskDevice[] }>('/api/kiosk/devices')
    },
    removeDevice(id: string) {
      return client.request(`/api/kiosk/devices/${id}`, { method: 'DELETE', successMessage: 'Киоск удалён' })
    },
    barbers(branchId: string) {
      return client.request<{ data: any[] }>(`/api/kiosk/barbers/${branchId}`)
    },
    book(payload: KioskBookingPayload) {
      return client.request('/api/kiosk/book', { body: payload, method: 'POST', successMessage: 'Запись создана' })
    },
    certificate(code: string) {
      return client.request(`/api/kiosk/certificate/${code}`)
    },
    index() {
      return client.request('/api/kiosk')
    },
    register(payload: KioskRegisterPayload) {
      return client.request('/api/kiosk/register', { body: payload, method: 'POST', successMessage: 'Киоск зарегистрирован' })
    },
    services(query?: Record<string, unknown>) {
      return client.request<{ categories?: any[], services?: any[] }>('/api/kiosk/services', { query })
    }
  }
}
