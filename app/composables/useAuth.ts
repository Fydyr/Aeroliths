import { ref, computed } from 'vue'
import type { Ref } from 'vue'

interface User {
  id: string
  email: string
  username: string
  name?: string
  surname?: string
  role: {
    id: string
    name: string
  }
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  username: string
  password: string
  name?: string
  surname?: string
}

const user: Ref<User | null> = ref(null)
const token: Ref<string | null> = ref(null)
const isLoading = ref(false)

export const useAuth = () => {
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Initialize auth state from localStorage
  const initAuth = async () => {
    if (import.meta.client) {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        token.value = storedToken
        try {
          await fetchCurrentUser()
        } catch (error) {
          // Token is invalid, clear it
          logout()
        }
      }
    }
  }

  // Fetch current user from API
  const fetchCurrentUser = async () => {
    if (!token.value) return

    try {
      const response = await $fetch<{ data: User }>('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      user.value = response.data
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      throw error
    }
  }

  // Login function
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    try {
      const response = await $fetch<{ data: { user: User; token: string } }>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      token.value = response.data.token
      user.value = response.data.user

      if (import.meta.client) {
        localStorage.setItem('auth_token', response.data.token)
      }

      return { success: true }
    } catch (error: any) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: error.data?.message || error.message || 'Login failed'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Register function
  const register = async (data: RegisterData) => {
    isLoading.value = true
    try {
      // First create the user
      await $fetch('/api/users', {
        method: 'POST',
        body: data
      })

      // Then login with the credentials
      return await login({
        email: data.email,
        password: data.password
      })
    } catch (error: any) {
      console.error('Registration failed:', error)
      return {
        success: false,
        error: error.data?.message || error.message || 'Registration failed'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Logout function
  const logout = () => {
    token.value = null
    user.value = null
    if (import.meta.client) {
      localStorage.removeItem('auth_token')
    }
    navigateTo('/login')
  }

  // Check if user has a specific role
  const hasRole = (roleName: string) => {
    return user.value?.role?.name === roleName
  }

  return {
    user: computed(() => user.value),
    token: computed(() => token.value),
    isAuthenticated,
    isLoading: computed(() => isLoading.value),
    initAuth,
    login,
    register,
    logout,
    hasRole
  }
}
