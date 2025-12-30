export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated, initAuth } = useAuth()

  // Initialize auth if not already done
  if (import.meta.client && !isAuthenticated.value) {
    const token = localStorage.getItem('auth_token')
    if (token) {
      // Try to restore session
      initAuth()
    }
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
