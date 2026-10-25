import { ref } from 'vue'

/**
 * Client-side request queue: at most MAX_CONCURRENT_REQUESTS requests are in
 * flight, the rest wait for a free slot. A limit of 1 chained every page's
 * parallel loads (≈6 BFF round trips) one after another and kept skeletons up
 * for seconds; 6 matches the browser's own per-host connection limit.
 *
 * Server-side (SSR) calls bypass the queue: module state is shared by every
 * visitor on the server, so queueing there would serialize unrelated users.
 */
export const MAX_CONCURRENT_REQUESTS = 6

const waiting: Array<() => void> = []
let running = 0

// Reactive counter for UI (full-page loader waits until the queue drains).
export const activeRequestCount = ref(0)

function release() {
  running -= 1
  activeRequestCount.value = running + waiting.length
  const next = waiting.shift()
  if (next) next()
}

export async function enqueueRequest<T>(task: () => Promise<T>): Promise<T> {
  if (import.meta.server) {
    return task()
  }

  if (running >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => {
      waiting.push(resolve)
      activeRequestCount.value = running + waiting.length
    })
  }

  running += 1
  activeRequestCount.value = running + waiting.length

  try {
    return await task()
  } finally {
    release()
  }
}
