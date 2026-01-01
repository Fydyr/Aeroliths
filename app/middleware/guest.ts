export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) {
    return
  }

  const { isAuthenticated, initAuth } = useAuth()

  // Check if we have a token in localStorage
  const token = localStorage.getItem('auth_token')

  // If we have a token but not authenticated, try to restore session
  if (token && !isAuthenticated.value) {
    try {
      await initAuth()
    } catch (error) {
      // If token is invalid, clear it
      console.error('Auth initialization failed:', error)
      localStorage.removeItem('auth_token')
    }
  }

  // If authenticated, redirect to home or play page
  if (isAuthenticated.value) {
    return navigateTo('/play')
  }
})
