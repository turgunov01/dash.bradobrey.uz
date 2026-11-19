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
 * Id of the company user the backend refused platform management to (403 in
 * tenant mode). The "Платформа" navigation hides itself for that user only,
 * so another login in the same tab starts clean.
 */
export function usePlatformManagementDenied() {
  return useState<string | null>('platform-management-denied-user', () => null)
}

/** 'platform' = platform-owner session; 'tenant' = main-company admin session. */
export type PlatformApiSource = PlatformOwnersSource

type CompanyResponse = { company: PlatformCompany }
type CompanyAdminResponse = { user: { id: string, login: string, role: string, company_id: string } }

/**
 * Company management. `platform`: BFF /api/platform/* with the platform-owner
 * session — never the company bearer token; a rejected session sends the owner
 * back to /platform/login. `tenant`: BFF /api/settings/platform-companies with
 * the main-company admin's own session (MULTI_TENANCY 12); errors are left to
 * the caller (a 403 hides the section).
 */
export function usePlatformApi(source: PlatformApiSource = 'platform') {
  return source === 'tenant' ? useTenantPlatformCompaniesApi() : useOwnerPlatformCompaniesApi()
}

function useTenantPlatformCompaniesApi() {
  const client = useApiClient()
  const base = '/api/settings/platform-companies'
  const companyUrl = (id: string) => `${base}/${encodeURIComponent(id)}`

  return {
    listCompanies() {
      return client.request<{ companies: PlatformCompany[] }>(base, { query: { __skipBranchScope: true }, silent: true })
    },
    createCompany(payload: CompanyCreatePayload) {
      return client.request<CompanyResponse>(base, { body: payload, method: 'POST', silent: true })
    },
    updateCompany(id: string, payload: CompanyUpdatePayload) {
      return client.request<CompanyResponse>(companyUrl(id), { body: payload, method: 'PATCH', silent: true })
    },
    createCompanyAdmin(id: string, payload: { login: string, password: string }) {
      return client.request<CompanyAdminResponse>(`${companyUrl(id)}/admins`, { body: payload, method: 'POST', silent: true })
    }
  }
}

function useOwnerPlatformCompaniesApi() {
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
      return call<CompanyResponse>('/api/platform/companies', 'POST', payload, { silent: true })
    },
    updateCompany(id: string, payload: CompanyUpdatePayload) {
      return call<CompanyResponse>(`/api/platform/companies/${encodeURIComponent(id)}`, 'PATCH', payload, { silent: true })
    },
    createCompanyAdmin(id: string, payload: { login: string, password: string }) {
      return call<CompanyAdminResponse>(`/api/platform/companies/${encodeURIComponent(id)}/admins`, 'POST', payload, { silent: true })
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
