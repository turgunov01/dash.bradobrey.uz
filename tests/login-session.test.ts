import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { getEffectiveEmployeePermissions } from '../shared/auth/employees.ts'
import { canAccessPath, firstAllowedPath } from '../app/utils/access.ts'

const adminTokenSource = readFileSync(
  new URL('../app/composables/useAdminToken.ts', import.meta.url),
  'utf8'
)
const loginPageSource = readFileSync(
  new URL('../app/pages/login.vue', import.meta.url),
  'utf8'
)
const sessionSource = readFileSync(
  new URL('../app/stores/session.ts', import.meta.url),
  'utf8'
)
const loginApiSource = readFileSync(
  new URL('../app/composables/useBarbersApi.ts', import.meta.url),
  'utf8'
)
const loginHandlerSource = readFileSync(
  new URL('../server/api/barbers/login.post.ts', import.meta.url),
  'utf8'
)
const environmentExample = readFileSync(
  new URL('../.env.example', import.meta.url),
  'utf8'
)
const nuxtConfigSource = readFileSync(
  new URL('../nuxt.config.ts', import.meta.url),
  'utf8'
)
const pm2ConfigSource = readFileSync(
  new URL('../ecosystem.config.cjs', import.meta.url),
  'utf8'
)

test('shares the admin token before the post-login profile request', () => {
  assert.match(adminTokenSource, /useState<string \| null>\(ADMIN_TOKEN_STATE_KEY/)
  assert.doesNotMatch(adminTokenSource, /listenToStorageChanges:\s*false/)
  assert.match(sessionSource, /adminToken\.set\(loginToken\)/)
  assert.match(sessionSource, /ensureLoaded\(\{ force: true, throwOnError: true, token: loginToken \|\| undefined \}\)/)
  assert.match(loginApiSource, /token\?: string/)
  assert.match(loginApiSource, /Authorization: `Bearer \$\{options\.token\}`/)
})

test('redirects successful logins to an allowed route instead of always opening root', () => {
  const permissions = new Set(
    getEffectiveEmployeePermissions({ permissions: ['employees.read'], role: 'manager' })
  )

  assert.equal(canAccessPath(permissions, '/'), false)
  assert.equal(firstAllowedPath(permissions), '/barbers')
  assert.match(loginPageSource, /firstAllowedPath\(new Set\(getEffectiveEmployeePermissions\(sessionStore\.user\)\)\)/)
  assert.match(loginPageSource, /if \(!redirectTo\)/)
  assert.match(loginPageSource, /sessionStore\.logout\(undefined, \{ silent: true \}\)/)
})

test('shows login failures inline and returns a client error for malformed credentials', () => {
  assert.match(loginApiSource, /login\(payload: LoginPayload\)[\s\S]*?\$fetch<BackendLoginResponse>/)
  assert.match(loginHandlerSource, /loginSchema\.safeParse\(await readBody\(event\)\)/)
  assert.match(loginHandlerSource, /statusCode:\s*400/)
  assert.doesNotMatch(loginHandlerSource, /loginSchema\.parse\(/)
})

test('uses only the requested backend login endpoint and payload', () => {
  assert.match(loginApiSource, /\$fetch<BackendLoginResponse>\("\/api\/barbers\/login"/)
  assert.match(loginApiSource, /baseURL,[\s\S]*?credentials: "omit"/)
  assert.match(loginApiSource, /Accept: "application\/json"/)
  assert.match(loginApiSource, /"Content-Type": "application\/json"/)
  assert.match(loginHandlerSource, /const path = '\/api\/barbers\/login'/)
  assert.match(loginHandlerSource, /Accept: 'application\/json'/)
  assert.match(loginHandlerSource, /'Content-Type': 'application\/json'/)
  assert.match(loginHandlerSource, /const body = \{\s*login: payload\.login,\s*password: payload\.password\s*\}/)
  assert.doesNotMatch(loginHandlerSource, /\/api\/barbers\/admin\/login/)
  assert.doesNotMatch(loginHandlerSource, /admin-fallback/)
})

test('cookie security defaults to the request protocol', () => {
  assert.match(environmentExample, /Leave unset to derive Secure from the request protocol/)
  assert.doesNotMatch(environmentExample, /^NUXT_COOKIE_SECURE=(?:true|false|1|0)$/m)
})

test('resolves TypeScript sources before same-name JavaScript build artifacts', () => {
  assert.match(nuxtConfigSource, /extensions:\s*\[[\s\S]*?'\.mts', '\.ts', '\.tsx', '\.js'/)
})

test('passes the server-only admin session secret to the PM2 production process', () => {
  assert.match(pm2ConfigSource, /NUXT_ADMIN_SESSION_SECRET:\s*process\.env\.NUXT_ADMIN_SESSION_SECRET/)
})

test('loads PM2 runtime env before reading the admin session secret', () => {
  assert.match(pm2ConfigSource, /loadEnvFile\(path\.join\(__dirname, '\.env'\)\)/)
  assert.match(pm2ConfigSource, /NUXT_ADMIN_SESSION_SECRET must be configured before starting/)
})

test('does not issue a backend token cookie before signing the dashboard session', () => {
  assert.match(
    loginHandlerSource,
    /setAdminSession\(event, \{[\s\S]*?role: user\.role\s*\}\)\s*setAdminBackendToken\(event, token\)/
  )
})
