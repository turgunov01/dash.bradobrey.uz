// The dashboard theme is light-only (see app/assets/css/main.css — no dark
// variants). @nuxtjs/color-mode gives a persisted browser preference priority
// over both nuxt.config's `colorMode.preference` and app.vue's assignment, so a
// stale "dark" / "system" value stored from before keeps flipping Nuxt UI text
// tokens to white on the light surfaces. Enforce light on the client and keep
// it pinned even if the module re-applies a stored value after init.
//
// Note: `colorMode.value` is a read-only computed — never assign to it. Do the
// DOM + storage writes first (they can't throw) so a stale class/value can't
// abort the fix, then nudge the writable `preference`.
export default defineNuxtPlugin(() => {
  const colorMode = useColorMode()

  const pinLight = () => {
    const root = document.documentElement
    root.classList.remove('dark')

    if (!root.classList.contains('light')) {
      root.classList.add('light')
    }

    try {
      window.localStorage.setItem('nuxt-color-mode', 'light')
    }
    catch {
      // localStorage may be unavailable (private mode); the class fix still holds.
    }

    if (colorMode.preference !== 'light') {
      colorMode.preference = 'light'
    }
  }

  pinLight()

  watch(() => colorMode.value, (value) => {
    if (value !== 'light') {
      pinLight()
    }
  })
})
