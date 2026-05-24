export default defineNuxtPlugin(() => {
  const adminToken = useAdminToken()

  const checkToken = () => {
    adminToken.clearExpired()
  }

  checkToken()

  const interval = window.setInterval(checkToken, 60 * 60 * 1000)
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkToken()
    }
  }

  window.addEventListener('focus', checkToken)
  document.addEventListener('visibilitychange', onVisibilityChange)

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.clearInterval(interval)
      window.removeEventListener('focus', checkToken)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    })
  }
})
