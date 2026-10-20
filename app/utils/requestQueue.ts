/**
 * Client-side request queue: a request is sent only after the previous one has
 * answered (request → response → next request). Raise MAX_CONCURRENT_REQUESTS
 * to allow some parallelism if pages become too slow.
 *
 * Server-side (SSR) calls bypass the queue: module state is shared by every
 * visitor on the server, so queueing there would serialize unrelated users.
 */
const MAX_CONCURRENT_REQUESTS = 1

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
