import { describePlatformError, getApiErrorCode, getApiErrorStatus } from '~~/shared/auth/tenancy'

export type CompanyStatus = 'active' | 'suspended'

export type PlatformCompany = {
  id: string
  name: string
  code: string
  status: CompanyStatus
  currency: string
  timezone: string
  logo_url: string | null
  primary_color: string | null
  is_default: boolean
  has_kiosk_enrollment_code: boolean
  created_at: string
  updated_at: string
}

export type CompanyCreatePayload = {
  name: string
  code: string
  currency?: string
  timezone?: string
  logo_url?: string | null
  primary_color?: string | null
}

export type CompanyUpdatePayload = Partial<CompanyCreatePayload> & {
  status?: CompanyStatus
  /** string = set/rotate, null = clear. Never returned by the API. */
  kiosk_enrollment_code?: string | null
}

export type PlatformOwner = {
  id: string
  login: string
  created_at?: string | null
}

export type PlatformOwnersSource = 'platform' | 'tenant'

type Method = 'GET' | 'PATCH' | 'POST'

/**
 * Platform-owner API (BFF /api/platform/*). Requests never carry the company
 * bearer token. A rejected platform session sends the owner back to /platform/login.
 */
export function usePlatformApi() {
  const nuxtApp = useNuxtApp()
  const toast = useToast()
  const requestFetch = useRequestFetch()

  async function call<T>(url: string, method: Method = 'GET', body?: Record<string, unknown>, options: { silent?: boolean } = {}) {
    try {
      return await requestFetch<T>(url, { body, credentials: 'include', method })
    }
    catch (error) {
      const status = getApiErrorStatus(error)
      const sessionLost = status === 401 || (status === 403 && getApiErrorCode(error) === 'PLATFORM_OWNER_REQUIRED')

      if (sessionLost && import.meta.client) {
        await nuxtApp.runWithContext(async () => {
          usePlatformSessionStore().endSession()
          await navigateTo('/platform/login')
        })
      }
      else if (!options.silent && import.meta.client) {
        toast.add({ color: 'error', description: describePlatformError(error), title: 'Ошибка запроса' })
      }

      throw error
    }
  }

  return {
    listCompanies() {
      return call<{ companies: PlatformCompany[] }>('/api/platform/companies')
    },
    createCompany(payload: CompanyCreatePayload) {
      return call<{ company: PlatformCompany }>('/api/platform/companies', 'POST', payload, { silent: true })
    },
    updateCompany(id: string, payload: CompanyUpdatePayload) {
      return call<{ company: PlatformCompany }>(`/api/platform/companies/${encodeURIComponent(id)}`, 'PATCH', payload, { silent: true })
    },
    createCompanyAdmin(id: string, payload: { login: string, password: string }) {
      return call<{ user: { id: string, login: string, role: string, company_id: string } }>(
        `/api/platform/companies/${encodeURIComponent(id)}/admins`, 'POST', payload, { silent: true }
      )
    }
  }
}

/**
 * Platform-owner accounts. The platform area uses the platform session; the
 * default company's admin_network uses its own company session (settings page).
 */
export function usePlatformOwnersApi(source: PlatformOwnersSource) {
  const client = useApiClient()

  if (source === 'platform') {
    const nuxtApp = useNuxtApp()
    const requestFetch = useRequestFetch()

    return {
      async list() {
        try {
          return await requestFetch<{ owners: PlatformOwner[] }>('/api/platform/owners', { credentials: 'include' })
        }
        catch (error) {
          if (getApiErrorStatus(error) === 401 && import.meta.client) {
            await nuxtApp.runWithContext(async () => {
              usePlatformSessionStore().endSession()
              await navigateTo('/platform/login')
            })
          }
          throw error
        }
      },
      create(payload: { login: string, password: string }) {
        return $fetch<{ owner: PlatformOwner }>('/api/platform/owners', { body: payload, credentials: 'include', method: 'POST' })
      }
    }
  }

  return {
    list() {
      return client.request<{ owners: PlatformOwner[] }>('/api/settings/platform-owners', { query: { __skipBranchScope: true }, silent: true })
    },
    create(payload: { login: string, password: string }) {
      return client.request<{ owner: PlatformOwner }>('/api/settings/platform-owners', { body: payload, method: 'POST', silent: true })
    }
  }
}
