// Multi-company (tenant) helpers shared by the Nuxt app and the Nitro BFF.
// Backend contract: api/.project/API.md "Companies" + "Platform owner" and
// api/.project/MULTI_TENANCY.md 9.7-9.10, 11. Pure functions only (unit-tested
// with node --test), no Nuxt auto-imports.

export const PLATFORM_OWNER_ROLE = 'platform_owner'

// PUT /api/kiosk/enrollment-code (api models/kioskEnrollment.js NETWORK_ROLES).
export const kioskEnrollmentRoles = ['admin_network', 'admin', 'super-manager'] as const
// POST /api/notifications/check-today (MULTI_TENANCY 11.2).
export const checkTodayOrdersRoles = ['admin_network', 'admin', 'admin_branch', 'super-manager'] as const
// Fallback for an API that predates /api/barbers/me `can_manage_platform`
// (MULTI_TENANCY 12): offer the "Платформа" section to admin_network only;
// the backend is the authority (403 for everyone else).
export const platformOwnerManagerRoles = ['admin_network'] as const

export const COMPANY_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{1,31}$/
export const ENROLLMENT_CODE_MIN_LENGTH = 8
export const ENROLLMENT_CODE_MAX_LENGTH = 128
export const PLATFORM_PASSWORD_MIN_LENGTH = 8
export const PLATFORM_PASSWORD_MAX_LENGTH = 128

const normalizeRole = (role: unknown) => String(role ?? '').trim().toLowerCase()

export function normalizeCompanyCode(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

export function isValidCompanyCode(value: unknown) {
  return COMPANY_CODE_PATTERN.test(normalizeCompanyCode(value))
}

export function isPlatformOwnerRole(role: unknown) {
  return normalizeRole(role) === PLATFORM_OWNER_ROLE
}

export function canRotateKioskEnrollmentCode(role: unknown) {
  return (kioskEnrollmentRoles as readonly string[]).includes(normalizeRole(role))
}

export function canCheckTodayOrders(role: unknown) {
  return (checkTodayOrdersRoles as readonly string[]).includes(normalizeRole(role))
}

export function canManagePlatformOwners(role: unknown) {
  return (platformOwnerManagerRoles as readonly string[]).includes(normalizeRole(role))
}

export type PlatformManagerUser = { role?: unknown, can_manage_platform?: unknown } | null | undefined

/**
 * Shows the company-session "Платформа" section (companies + platform owners):
 * the backend flag from /api/barbers/me (admin_network/admin of the active
 * main company), else the role fallback. UI hint only — the API re-checks.
 */
export function canManagePlatform(user: PlatformManagerUser) {
  if (!user) return false
  if (typeof user.can_manage_platform === 'boolean') return user.can_manage_platform
  return canManagePlatformOwners(user.role)
}

export function isPlatformAreaPath(path: string) {
  return path === '/platform' || path.startsWith('/platform/')
}

type ErrorBody = { code?: unknown, error?: unknown, message?: unknown, failed?: unknown, data?: unknown }

function asBody(value: unknown): ErrorBody | null {
  return value && typeof value === 'object' ? value as ErrorBody : null
}

/**
 * Upstream error body regardless of the transport: direct backend $fetch
 * (`error.data = body`), the BFF (`error.data.data = body`) or an h3 error
 * thrown on the server (`error.data = body`).
 */
export function getApiErrorBody(error: unknown): ErrorBody | null {
  const source = error as Record<string, any> | null
  const candidates = [source?.data, source?.response?._data]

  for (const candidate of candidates) {
    const body = asBody(candidate)
    if (!body) continue
    const nested = asBody(body.data)
    if (nested && (nested.code || nested.error || nested.failed)) return nested
    if (body.code || body.error || body.failed) return body
  }

  return null
}

export function getApiErrorCode(error: unknown): string | null {
  const code = getApiErrorBody(error)?.code
  return typeof code === 'string' && code ? code : null
}

export function getApiErrorStatus(error: unknown): number {
  const source = error as Record<string, any> | null
  return Number(source?.statusCode || source?.status || source?.response?.status || 0)
}

// Backend answers that invalidate a tenant (company) session: the BFF clears
// its cookies and the client logs out with this message.
export const sessionEndMessages: Record<string, string> = {
  TOKEN_ROLE_STALE: 'Ваша роль изменилась. Войдите заново.',
  COMPANY_SUSPENDED: 'Доступ компании приостановлен. Обратитесь к владельцу платформы.',
  TOKEN_COMPANY_MISMATCH: 'Сессия устарела. Войдите заново.',
  COMPANY_REQUIRED: 'Учётная запись не привязана к компании. Обратитесь к администратору.',
  PLATFORM_OWNER_NO_TENANT_ACCESS: 'Владелец платформы не имеет доступа к данным компаний.'
}

export function isSessionEndCode(code: unknown): code is string {
  return typeof code === 'string' && Object.hasOwn(sessionEndMessages, code)
}

export function getSessionEndReason(error: unknown): string | null {
  const code = getApiErrorCode(error)
  return isSessionEndCode(code) ? code : null
}

export function sessionEndMessage(reason: unknown) {
  return isSessionEndCode(reason) ? sessionEndMessages[reason] : null
}

export type LoginErrorField = 'company_code' | 'password'

/** Russian message for a failed staff login, with the form field to attach it to. */
export function describeLoginError(error: unknown): { field: LoginErrorField, message: string } {
  const body = getApiErrorBody(error)
  const code = getApiErrorCode(error)
  const apiError = typeof body?.error === 'string' ? body.error : typeof body?.message === 'string' ? body.message : ''

  switch (code) {
    case 'COMPANY_CODE_REQUIRED':
      return { field: 'company_code', message: 'Введите код компании.' }
    case 'COMPANY_NOT_FOUND':
      return { field: 'company_code', message: 'Компания с таким кодом не найдена или отключена.' }
    case 'COMPANY_SUSPENDED':
      return { field: 'company_code', message: 'Доступ компании приостановлен. Обратитесь к владельцу платформы.' }
  }

  if (apiError === 'Employee access has been revoked') {
    return { field: 'password', message: 'Доступ сотрудника отозван. Обратитесь к администратору для восстановления.' }
  }
  if (apiError === 'Invalid credentials') {
    return { field: 'password', message: 'Неверный код компании, логин или пароль.' }
  }

  const fallback = apiError || (error as Error | null)?.message || ''
  return { field: 'password', message: fallback || 'Не удалось войти. Повторите попытку.' }
}

export const multiCompanyPreconditionLabels: Record<string, string> = {
  KIOSK_AUTH_ENFORCE: 'Включите обязательную авторизацию киосков: KIOSK_AUTH_ENFORCE=true в окружении API (все киоски должны иметь токен устройства).',
  TENANT_STRICT: 'Включите строгий режим компаний в базе данных: app.tenant_strict = on (и перезапустите API).'
}

export function describeMultiCompanyPreconditions(failed: unknown): string[] {
  const items = Array.isArray(failed) ? failed.map(String) : []
  return items.map(item => multiCompanyPreconditionLabels[item] || `Не выполнено условие: ${item}`)
}

/** Russian message for platform/company management errors. */
export function describePlatformError(error: unknown): string {
  const body = getApiErrorBody(error)
  const code = getApiErrorCode(error)

  switch (code) {
    case 'MULTI_COMPANY_PRECONDITIONS':
      return 'Вторую компанию нельзя включить, пока не выполнены условия безопасности.'
    case 'COMPANY_CODE_TAKEN':
      return 'Этот код компании уже занят.'
    case 'LOGIN_TAKEN':
      return 'Этот логин уже занят.'
    case 'DEFAULT_COMPANY_SUSPEND_FORBIDDEN':
      return 'Основную компанию приостановить нельзя.'
    case 'PLATFORM_OWNER_REQUIRED':
      return 'Действие доступно только владельцу платформы.'
    case 'DEFAULT_COMPANY_ADMIN_FORBIDDEN':
      return 'Администраторов основной компании создавайте в разделе «Сотрудники».'
  }

  if (getApiErrorStatus(error) === 403) return 'Недостаточно прав для этого действия.'

  const apiError = typeof body?.error === 'string' ? body.error : typeof body?.message === 'string' ? body.message : ''
  return apiError || (error as Error | null)?.message || 'Не удалось выполнить запрос.'
}
