import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const projectRoot = join(import.meta.dirname, '..')
const pageSource = readFileSync(join(projectRoot, 'app/pages/settings/no-show-restrictions.vue'), 'utf8')
const apiSource = readFileSync(join(projectRoot, 'app/composables/useNoShowRestrictionSettingsApi.ts'), 'utf8')

test('loads no-show settings through the supported collection endpoint', () => {
  assert.match(apiSource, /client\.request<SettingsResponse>\('\/api\/marketplace\/admin\/settings'/)
  assert.doesNotMatch(apiSource.split('updateSettings')[0], /\/api\/marketplace\/admin\/settings\/no_show_restrictions/)
  assert.match(apiSource, /method: 'PATCH'/)
  assert.match(apiSource, /body: \{ value: payload \}/)
  assert.match(apiSource, /first_violation_minutes: Number\(value\.first_violation_minutes\)/)
  assert.match(apiSource, /lookback_days: Number\(value\.lookback_days\)/)
})

test('strips the internal branch-scope control parameter from mutation URLs', () => {
  const clientSource = readFileSync(join(projectRoot, 'app/composables/useApiClient.ts'), 'utf8')
  assert.match(clientSource, /const nextQuery: Record<string, unknown> = \{\n\s+\.\.\.\(query \|\| \{\}\)\n\s+\}/)
  assert.match(clientSource, /delete \(nextQuery as any\).__skipBranchScope/)
})

test('uses SSR-compatible async data and avoids cloning reactive snapshots', () => {
  assert.doesNotMatch(pageSource, /server:\s*false/)
  assert.match(pageSource, /const snapshot = shallowRef<NoShowRestrictionSettings \| null>\(null\)/)
  assert.match(pageSource, /Object\.assign\(form, copySettings\(snapshot\.value\)\)/)
  assert.doesNotMatch(pageSource, /structuredClone\(snapshot\.value\)/)
})
