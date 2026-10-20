<script setup lang="ts">
// Full-page loader shown on the first page load. It is part of the SSR HTML,
// so it covers the page from the very first paint, and fades out once the app
// has hydrated and the request queue has drained.
const MIN_VISIBLE_MS = 600
const MAX_VISIBLE_MS = 15000

const visible = ref(true)

if (import.meta.client) {
  const shownAt = performance.now()
  let hidden = false

  const hide = () => {
    if (hidden) return
    hidden = true
    const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt))
    window.setTimeout(() => {
      visible.value = false
    }, wait)
  }

  onNuxtReady(() => {
    // Give lazy page fetches a tick to enqueue before checking the queue.
    window.setTimeout(() => {
      if (activeRequestCount.value === 0) {
        hide()
        return
      }
      const stop = watch(activeRequestCount, (count) => {
        if (count === 0) {
          stop()
          hide()
        }
      })
    }, 50)
  })

  // Never trap the user behind the loader if a request hangs.
  window.setTimeout(hide, MAX_VISIBLE_MS)
}
</script>

<template>
  <Transition leave-active-class="transition-opacity duration-500" leave-to-class="opacity-0">
    <div
      v-if="visible"
      class="page-loader fixed inset-0 z-[100] flex items-center justify-center bg-sand-50/55 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label="Загрузка Bradobrey"
    >
      <div class="page-loader__logo flex flex-col items-center gap-4">
        <img
          src="/brand-logo.png"
          alt="Bradobrey — парикмахерская для мужчин"
          width="160"
          height="147"
          class="w-36 rounded-xl shadow-2xl shadow-charcoal-950/30 sm:w-40"
        >
        <span class="text-xs font-semibold uppercase tracking-[0.3em] text-charcoal-700">
          bradobrey.uz
        </span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.page-loader__logo {
  animation:
    page-loader-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) both,
    page-loader-float 2.4s ease-in-out 700ms infinite;
}

@keyframes page-loader-rise {
  from {
    opacity: 0;
    transform: translateY(32px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes page-loader-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-loader__logo {
    animation: none;
  }
}
</style>
