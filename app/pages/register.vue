<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1>Join Aeroliths</h1>
          <p>Create your account to start playing</p>
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="username">Username *</label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              placeholder="Choose a username"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              placeholder="your.email@example.com"
              :disabled="isLoading"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="name">First Name</label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                placeholder="John"
                :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="surname">Last Name</label>
              <input
                id="surname"
                v-model="formData.surname"
                type="text"
                placeholder="Doe"
                :disabled="isLoading"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password *</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              minlength="8"
              placeholder="At least 8 characters"
              :disabled="isLoading"
            />
            <small class="form-hint">Minimum 8 characters</small>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              placeholder="Re-enter your password"
              :disabled="isLoading"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="register-button" :disabled="isLoading">
            <span v-if="!isLoading">Create Account</span>
            <span v-else>Creating account...</span>
          </button>
        </form>

        <div class="register-footer">
          <p>
            Already have an account?
            <NuxtLink to="/login">Login here</NuxtLink>
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

const { register, isLoading, isAuthenticated } = useAuth()

const formData = ref({
  email: '',
  username: '',
  password: '',
  name: '',
  surname: ''
})

const confirmPassword = ref('')
const errorMessage = ref('')

// Redirect if already authenticated
onMounted(() => {
  if (isAuthenticated.value) {
    navigateTo('/')
  }
})

const handleRegister = async () => {
  errorMessage.value = ''

  // Validate passwords match
  if (formData.value.password !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  // Validate password length
  if (formData.value.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long'
    return
  }

  // Prepare data (remove empty optional fields)
  const registrationData = {
    email: formData.value.email,
    username: formData.value.username,
    password: formData.value.password,
    ...(formData.value.name && { name: formData.value.name }),
    ...(formData.value.surname && { surname: formData.value.surname })
  }

  const result = await register(registrationData)

  if (result.success) {
    navigateTo('/play')
  } else {
    errorMessage.value = result.error || 'Registration failed. Please try again.'
  }
}

useHead({
  title: 'Register - Aeroliths',
  meta: [
    { name: 'description', content: 'Create an account to play Aeroliths' }
  ]
})
</script>

<style scoped src="~/assets/css/register.css"></style>
