export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brass',
      neutral: 'charcoal'
    },
    icons: {
      loading: 'i-lucide-loader-circle'
    },
    // Loading placeholders must contrast with the surface: grey on the light
    // theme, light on the dark theme (default bg-elevated is nearly invisible).
    skeleton: {
      base: 'animate-pulse rounded-md bg-charcoal-200/90 dark:bg-white/25'
    }
  }
})
