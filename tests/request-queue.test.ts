import { test } from 'node:test'
import assert from 'node:assert/strict'

import { MAX_CONCURRENT_REQUESTS, activeRequestCount, enqueueRequest } from '../app/utils/requestQueue.ts'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

test('independent page requests run in parallel instead of one by one', async () => {
  assert.ok(MAX_CONCURRENT_REQUESTS >= 4, 'a page fires ~6 requests at once; a limit of 1 chains them into a long skeleton')

  const gates = Array.from({ length: MAX_CONCURRENT_REQUESTS }, () => deferred())
  let started = 0

  const tasks = gates.map(gate => enqueueRequest(async () => {
    started += 1
    await gate.promise
  }))

  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(started, MAX_CONCURRENT_REQUESTS)

  gates.forEach(gate => gate.resolve())
  await Promise.all(tasks)
  assert.equal(activeRequestCount.value, 0)
})

test('requests above the limit wait for a free slot', async () => {
  const gates = Array.from({ length: MAX_CONCURRENT_REQUESTS + 1 }, () => deferred())
  let started = 0

  const tasks = gates.map(gate => enqueueRequest(async () => {
    started += 1
    await gate.promise
  }))

  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(started, MAX_CONCURRENT_REQUESTS)
  assert.equal(activeRequestCount.value, MAX_CONCURRENT_REQUESTS + 1)

  gates[0]!.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(started, MAX_CONCURRENT_REQUESTS + 1)

  gates.forEach(gate => gate.resolve())
  await Promise.all(tasks)
  assert.equal(activeRequestCount.value, 0)
})
