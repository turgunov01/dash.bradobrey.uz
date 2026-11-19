export type ResolvedCompany = {
  id: string
  name: string
  code: string
  logo_url?: string | null
  primary_color?: string | null
  currency?: string | null
}

export function useCompaniesApi() {
  return {
    // POST /api/companies/resolve { code }. Like the login request, production
    // calls the API directly (the per-IP rate limit then counts the user's IP,
    // not the dashboard server's); local development uses the BFF route.
    resolve(code: string) {
      const config = useRuntimeConfig()
      const baseURL = String(config.public.apiBase || 'https://api.bradobrey.uz').replace(/\/+$/, '')
      const isLocalDashboard = import.meta.client
        && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)

      return $fetch<{ company: ResolvedCompany }>('/api/companies/resolve', {
        ...(isLocalDashboard ? {} : { baseURL }),
        body: { code },
        credentials: 'omit',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        method: 'POST'
      })
    }
  }
}
