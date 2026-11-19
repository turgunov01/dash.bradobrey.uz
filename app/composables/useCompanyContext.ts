import { normalizeCompanyCode } from '~~/shared/auth/tenancy'

const LAST_COMPANY_CODE_KEY = 'brado_last_company_code'
const COMPANY_COOKIE = 'brado_company'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export type CompanyDisplay = {
  id: string
  code: string
  name: string | null
}

/**
 * Which company the dashboard user works in. The backend session carries
 * only `company_id`; the code the user typed and the name returned by
 * /api/companies/resolve are kept in a non-sensitive cookie (readable during
 * SSR) and shown only while they match the session's company_id.
 */
export function useCompanyContext() {
  const sessionStore = useSessionStore()
  const company = useCookie<CompanyDisplay | null>(COMPANY_COOKIE, {
    default: () => null,
    maxAge: ONE_YEAR_SECONDS,
    path: '/',
    sameSite: 'lax'
  })

  const current = computed<CompanyDisplay | null>(() => {
    const sessionCompanyId = String(sessionStore.user?.company_id || '').trim()
    const stored = company.value

    if (stored?.id && sessionCompanyId && stored.id === sessionCompanyId) {
      return stored
    }

    const sessionCode = normalizeCompanyCode(sessionStore.user?.company_code)
    return sessionCompanyId && sessionCode ? { id: sessionCompanyId, code: sessionCode, name: null } : null
  })

  function readLastCode() {
    if (!import.meta.client) return ''

    try {
      return normalizeCompanyCode(globalThis.localStorage.getItem(LAST_COMPANY_CODE_KEY))
    }
    catch {
      return ''
    }
  }

  function rememberCode(code: string) {
    if (!import.meta.client) return

    try {
      const normalized = normalizeCompanyCode(code)
      if (normalized) globalThis.localStorage.setItem(LAST_COMPANY_CODE_KEY, normalized)
      else globalThis.localStorage.removeItem(LAST_COMPANY_CODE_KEY)
    }
    catch {
      // Prefill is a convenience only.
    }
  }

  function setCompany(value: CompanyDisplay | null) {
    company.value = value
  }

  return { current, readLastCode, rememberCode, setCompany }
}
