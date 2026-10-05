import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const rankingSource = readFileSync(
  new URL('../app/components/statistics/EmployeeQualityRanking.vue', import.meta.url),
  'utf8'
)
const analyticsSource = readFileSync(
  new URL('../app/composables/useStatisticsAnalytics.ts', import.meta.url),
  'utf8'
)
const historyBffSource = readFileSync(
  new URL('../server/api/history/index.get.ts', import.meta.url),
  'utf8'
)
const statisticsBffSource = readFileSync(
  new URL('../server/api/statistics/index.get.ts', import.meta.url),
  'utf8'
)

test('client-only statistics requests start after hydration', () => {
  assert.match(rankingSource, /immediate:\s*false/)
  assert.match(rankingSource, /onMounted\(\(\)\s*=>\s*\{[\s\S]*void refresh\(\)/)
  assert.match(analyticsSource, /immediate:\s*false/)
  assert.match(analyticsSource, /onMounted\(\(\)\s*=>\s*\{[\s\S]*void refresh\(\)/)
  assert.doesNotMatch(analyticsSource, /export async function useStatisticsAnalytics/)
  assert.doesNotMatch(analyticsSource, /await statisticsData/)
})

test('history and statistics BFF routes require the authenticated backend session', () => {
  assert.match(historyBffSource, /proxyBackend<unknown>\(event, '\/api\/history', 'required'\)/)
  assert.match(statisticsBffSource, /proxyBackend<unknown>\(event, '\/api\/statistics', 'required'\)/)
})
