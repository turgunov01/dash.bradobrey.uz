import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  canCheckTodayOrders,
  canManagePlatform,
  canManagePlatformOwners,
  canRotateKioskEnrollmentCode,
  describeLoginError,
  describeMultiCompanyPreconditions,
  describePlatformError,
  getApiErrorBody,
  getApiErrorCode,
  getSessionEndReason,
  isPlatformAreaPath,
  isPlatformOwnerRole,
  isValidCompanyCode,
  normalizeCompanyCode,
  sessionEndMessage
} from '../shared/auth/tenancy.ts'
import {
  buildCompanyPayload,
  emptyCompanyForm,
  generateEnrollmentCode,
  validateCompanyForm,
  validateEnrollmentCode
} from '../app/utils/platformCompany.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

const loginHandlerSource = read('server/api/barbers/login.post.ts')
const loginApiSource = read('app/composables/useBarbersApi.ts')
const loginPageSource = read('app/pages/login.vue')
const backendSource = read('server/utils/backend.ts')
const platformSessionSource = read('server/utils/platform-session.ts')
const platformLoginSource = read('server/api/platform/login.post.ts')
const authMiddlewareSource = read('app/middleware/auth.global.ts')
const notificationsSource = read('app/pages/notifications.vue')
const enrollmentHandlerSource = read('server/api/kiosk/enrollment-code.put.ts')
const navigationSource = read('app/composables/useDashboardNavigation.ts')

// --- BFF error shapes -------------------------------------------------------

const viaBff = (status: number, body: Record<string, unknown>) => ({ statusCode: status, data: { statusCode: status, message: body.error, data: body } })
const direct = (status: number, body: Record<string, unknown>) => ({ status, data: body })

test('reads backend error codes from direct API and BFF responses', () => {
  const body = { code: 'COMPANY_NOT_FOUND', error: 'Company not found' }

  assert.equal(getApiErrorCode(direct(404, body)), 'COMPANY_NOT_FOUND')
  assert.equal(getApiErrorCode(viaBff(404, body)), 'COMPANY_NOT_FOUND')
  assert.equal(getApiErrorCode({ response: { _data: body } }), 'COMPANY_NOT_FOUND')
  assert.equal(getApiErrorCode(new Error('network')), null)
  assert.deepEqual(getApiErrorBody(viaBff(409, { code: 'MULTI_COMPANY_PRECONDITIONS', failed: ['TENANT_STRICT'] }))?.failed, ['TENANT_STRICT'])
})

test('maps company login failures to the company code field with Russian messages', () => {
  assert.deepEqual(describeLoginError(viaBff(400, { code: 'COMPANY_CODE_REQUIRED', error: 'company_code is required' })), {
    field: 'company_code',
    message: 'Введите код компании.'
  })
  assert.equal(describeLoginError(direct(404, { code: 'COMPANY_NOT_FOUND', error: 'Company not found' })).field, 'company_code')
  assert.match(describeLoginError(direct(403, { code: 'COMPANY_SUSPENDED' })).message, /приостановлен/)
  assert.deepEqual(describeLoginError(direct(400, { error: 'Invalid credentials' })), {
    field: 'password',
    message: 'Неверный код компании, логин или пароль.'
  })
  assert.match(describeLoginError(direct(403, { error: 'Employee access has been revoked' })).message, /отозван/)
})

test('treats revoked role/company tokens as a session end with a reason', () => {
  assert.equal(getSessionEndReason(viaBff(401, { code: 'TOKEN_ROLE_STALE' })), 'TOKEN_ROLE_STALE')
  assert.equal(getSessionEndReason(direct(403, { code: 'COMPANY_SUSPENDED' })), 'COMPANY_SUSPENDED')
  assert.equal(getSessionEndReason(direct(401, { code: 'TOKEN_COMPANY_MISMATCH' })), 'TOKEN_COMPANY_MISMATCH')
  assert.equal(getSessionEndReason(direct(403, { code: 'FORBIDDEN' })), null)
  assert.equal(getSessionEndReason(direct(400, { error: 'Invalid credentials' })), null)
  assert.match(String(sessionEndMessage('TOKEN_ROLE_STALE')), /Войдите заново/)
  assert.equal(sessionEndMessage('<script>'), null)
})

test('normalizes and validates company codes like the backend', () => {
  assert.equal(normalizeCompanyCode('  bradobrey '), 'BRADOBREY')
  assert.equal(isValidCompanyCode('president-1'), true)
  assert.equal(isValidCompanyCode('a'), false)
  assert.equal(isValidCompanyCode('-abc'), false)
  assert.equal(isValidCompanyCode('код'), false)
  assert.equal(normalizeCompanyCode(undefined), '')
})

test('limits role-gated actions to the roles the backend allows', () => {
  for (const role of ['admin_network', 'admin', 'admin_branch', 'super-manager']) assert.equal(canCheckTodayOrders(role), true, role)
  for (const role of ['manager', 'barber', 'merchant', null]) assert.equal(canCheckTodayOrders(role), false, String(role))

  for (const role of ['admin_network', 'admin', 'super-manager']) assert.equal(canRotateKioskEnrollmentCode(role), true, role)
  for (const role of ['admin_branch', 'manager', 'barber']) assert.equal(canRotateKioskEnrollmentCode(role), false, role)

  assert.equal(canManagePlatformOwners('admin_network'), true)
  assert.equal(canManagePlatformOwners('admin'), false)

  // /api/barbers/me can_manage_platform (MULTI_TENANCY 12) decides; older API
  // without the flag falls back to the admin_network role (backend 403 rules).
  assert.equal(canManagePlatform({ role: 'admin', can_manage_platform: true }), true)
  assert.equal(canManagePlatform({ role: 'admin_network', can_manage_platform: false }), false)
  assert.equal(canManagePlatform({ role: 'admin_network' }), true)
  assert.equal(canManagePlatform({ role: 'admin_branch' }), false)
  assert.equal(canManagePlatform(null), false)
  assert.equal(isPlatformOwnerRole(' Platform_Owner '), true)
  assert.equal(isPlatformAreaPath('/platform/companies'), true)
  assert.equal(isPlatformAreaPath('/platformer'), false)
})

test('explains multi-company preconditions and platform errors in Russian', () => {
  const lines = describeMultiCompanyPreconditions(['KIOSK_AUTH_ENFORCE', 'TENANT_STRICT', 'NEW_CHECK'])

  assert.equal(lines.length, 3)
  assert.match(lines[0]!, /KIOSK_AUTH_ENFORCE=true/)
  assert.match(lines[1]!, /app\.tenant_strict = on/)
  assert.match(lines[2]!, /NEW_CHECK/)
  assert.deepEqual(describeMultiCompanyPreconditions(undefined), [])

  assert.equal(describePlatformError(viaBff(409, { code: 'COMPANY_CODE_TAKEN' })), 'Этот код компании уже занят.')
  assert.equal(describePlatformError(viaBff(409, { code: 'DEFAULT_COMPANY_SUSPEND_FORBIDDEN' })), 'Основную компанию приостановить нельзя.')
  assert.equal(describePlatformError(viaBff(403, { error: 'nope' })), 'Недостаточно прав для этого действия.')
  assert.match(describePlatformError(viaBff(403, { code: 'DEFAULT_COMPANY_ADMIN_FORBIDDEN' })), /Сотрудники/)
})

// --- company form helpers ----------------------------------------------------

test('builds a create payload with only filled optional fields', () => {
  const form = { ...emptyCompanyForm(), name: ' President ', code: 'president', currency: 'uzs' }

  assert.deepEqual(validateCompanyForm(form), {})
  assert.deepEqual(buildCompanyPayload(form), { name: 'President', code: 'PRESIDENT', currency: 'UZS' })
})

test('builds a minimal update payload and clears branding with null', () => {
  const original = { name: 'President', code: 'PRESIDENT', currency: 'UZS', timezone: 'Asia/Tashkent', logo_url: 'https://x.test/logo.png', primary_color: '#112233' }
  const form = { ...emptyCompanyForm(original), name: 'President Barbers', logo_url: '', timezone: '' }

  assert.deepEqual(buildCompanyPayload(form, original), { name: 'President Barbers', logo_url: null })
  assert.deepEqual(buildCompanyPayload(emptyCompanyForm(original), original), {})
})

test('rejects invalid company form values', () => {
  const errors = validateCompanyForm({ name: '', code: 'x', currency: 'SUM1', timezone: '', logo_url: 'javascript:alert(1)', primary_color: 'red' })

  assert.deepEqual(Object.keys(errors).sort(), ['code', 'currency', 'logo_url', 'name', 'primary_color'])
})

test('validates and generates kiosk enrollment codes', () => {
  assert.match(validateEnrollmentCode('short'), /от 8 до 128/)
  assert.equal(validateEnrollmentCode('  12345678  '), '')

  const code = generateEnrollmentCode(12, bytes => bytes.map((_, index) => index * 7))
  assert.equal(code.length, 12)
  assert.match(code, /^[A-HJ-NP-Z2-9]+$/)
  assert.equal(validateEnrollmentCode(generateEnrollmentCode()), '')
})

// --- wiring (source contracts) -----------------------------------------------

test('passes company_code from both login paths to the backend', () => {
  assert.match(loginApiSource, /payload\.company_code \? \{ company_code: payload\.company_code \} : \{\}/)
  assert.match(loginHandlerSource, /if \(companyCode\) Object\.assign\(body, \{ company_code: companyCode \}\)/)
  assert.match(loginHandlerSource, /company_id: user\.company_id/)
  assert.match(loginPageSource, /label="Код компании"/)
  assert.match(loginPageSource, /companyContext\.readLastCode\(\)/)
  assert.match(loginPageSource, /describeLoginError\(error\)/)
})

test('drops tenant cookies when the backend revokes the session', () => {
  assert.match(backendSource, /getSessionEndReason\(\{ data: error\?\.response\?\._data \}\)/)
  assert.match(backendSource, /clearTenantSessionCookies\(event\)/)
})

test('keeps the platform token server-side and separate from company sessions', () => {
  assert.match(platformSessionSource, /httpOnly: true/)
  assert.match(platformSessionSource, /session: 'platform'/)
  assert.match(platformSessionSource, /Authorization: `Bearer \$\{token\}`/)
  assert.match(platformLoginSource, /clearTenantSessionCookies\(event\)/)
  assert.doesNotMatch(platformLoginSource, /return \{[^}]*token/)
})

test('confines platform owners to the platform area and hides it from company users', () => {
  assert.match(authMiddlewareSource, /if \(isPlatformAreaPath\(to\.path\)\) \{\n\s+return platformSession\.isAuthenticated \? undefined : navigateTo\("\/platform\/login"\)/)
  assert.match(authMiddlewareSource, /if \(platformSession\.isAuthenticated\) \{\n\s+return navigateTo\(PLATFORM_HOME\)/)
  assert.match(authMiddlewareSource, /PLATFORM_MANAGEMENT_PATHS\.includes\(to\.path\) && !canManagePlatform\(sessionStore\.user\)/)
  assert.match(navigationSource, /isPlatformManagementPath\(item\.to\) && !showPlatform\.value/)
})

test('main-company admins manage companies through company-token BFF routes', () => {
  const routes = {
    list: read('server/api/settings/platform-companies/index.get.ts'),
    create: read('server/api/settings/platform-companies/index.post.ts'),
    patch: read('server/api/settings/platform-companies/[id].patch.ts'),
    admins: read('server/api/settings/platform-companies/[id]/admins.post.ts')
  }

  for (const [name, source] of Object.entries(routes)) {
    // Company token (auth: 'required'), never the platform cookie.
    assert.match(source, /auth: 'required'/, name)
    assert.doesNotMatch(source, /proxyPlatformBackend|getPlatformToken/, name)
  }
  assert.match(routes.list, /path: '\/api\/platform\/companies'/)
  assert.match(routes.patch, /requirePlatformCompanyId\(event\)/)
  assert.match(routes.patch, /'kiosk_enrollment_code'/)
  assert.match(routes.admins, /pickFields\(.*, \['login', 'password'\]\)/)

  const platformApiSource = read('app/composables/usePlatformApi.ts')
  assert.match(platformApiSource, /\/api\/settings\/platform-companies/)

  // The platform-owner area keeps its own session routes.
  assert.match(read('app/pages/platform/companies/index.vue'), /<PlatformCompaniesPanel source="platform"/)
  assert.match(read('app/pages/settings/platform-companies.vue'), /<PlatformCompaniesPanel source="tenant"/)
  assert.match(navigationSource, /label: "Платформа"/)
})

test('/me flags survive the dashboard session user mapping', () => {
  const accessSource = read('server/utils/admin-access.ts')
  // Absent on an older API -> undefined, so canManagePlatform falls back to the role.
  assert.match(accessSource, /can_manage_platform: optionalFlag\(accessUser\.can_manage_platform\)/)
  assert.match(accessSource, /company_is_default: optionalFlag\(accessUser\.company_is_default\)/)
})

test('requires a staff token for kiosk enrollment-code rotation and hides check-today for other roles', () => {
  assert.match(enrollmentHandlerSource, /auth: 'required'/)
  assert.match(enrollmentHandlerSource, /\['enrollment_code'\]/)
  assert.match(notificationsSource, /<UTooltip v-if="canCheckToday"/)
})
