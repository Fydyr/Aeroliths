<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Welcome Back</h1>
          <p>Login to access Aeroliths</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="credentials.email"
              type="email"
              required
              placeholder="your.email@example.com"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              required
              placeholder="Enter your password"
              :disabled="isLoading"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            <span v-if="!isLoading">Login</span>
            <span v-else>Logging in...</span>
          </button>
        </form>

        <div class="login-footer">
          <p>
            Don't have an account?
            <NuxtLink to="/register">Register here</NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'default'
})

const { login, isLoading, isAuthenticated } = useAuth()

const credentials = ref({
  email: '',
  password: ''
})

const errorMessage = ref('')

// Redirect if already authenticated
onMounted(() => {
  if (isAuthenticated.value) {
    navigateTo('/')
  }
})

const handleLogin = async () => {
  errorMessage.value = ''

  const result = await login(credentials.value)

  if (result.success) {
    navigateTo('/play')
  } else {
    errorMessage.value = result.error || 'Login failed. Please check your credentials.'
  }
}

useHead({
  title: 'Login - Aeroliths',
  meta: [
    { name: 'description', content: 'Login to access Aeroliths game' }
  ]
})
</script>

<style scoped src="~/assets/css/login.css"></style>
