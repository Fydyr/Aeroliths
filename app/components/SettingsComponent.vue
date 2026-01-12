<template>
  <div class="settings-container">
    <div class="settings-card">
      <h1>Account Settings</h1>

      <form @submit.prevent="handleSubmit" class="settings-form">
        <!-- Profile Picture -->
        <div class="form-group">
          <label for="profile-picture">Profile Picture</label>
          <div class="profile-picture-upload">
            <div v-if="formData.profilePicture" class="profile-picture-preview">
              <img :src="formData.profilePicture" alt="Profile picture" />
              <button
                type="button"
                @click="removeProfilePicture"
                class="remove-btn"
                :disabled="loading"
              >
                Remove
              </button>
            </div>
            <div v-else class="profile-picture-placeholder">
              <span>No profile picture</span>
            </div>
            <input
              id="profile-picture"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              @change="handleProfilePictureUpload"
              :disabled="loading || uploadingProfilePicture"
            />
            <span v-if="uploadingProfilePicture" class="uploading-text">Uploading...</span>
          </div>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="your@email.com"
            :disabled="loading"
          />
        </div>

        <!-- Username -->
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="Your username"
            :disabled="loading"
          />
        </div>

        <!-- Name -->
        <div class="form-group">
          <label for="name">First Name</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="Your first name (optional)"
            :disabled="loading"
          />
        </div>

        <!-- Surname -->
        <div class="form-group">
          <label for="surname">Last Name</label>
          <input
            id="surname"
            v-model="formData.surname"
            type="text"
            placeholder="Your last name (optional)"
            :disabled="loading"
          />
        </div>

        <!-- Error message -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Success message -->
        <div v-if="success" class="success-message">
          {{ success }}
        </div>

        <!-- Submit button -->
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Updating...' : 'Save Changes' }}
        </button>
      </form>

      <!-- Password change section -->
      <div class="password-section">
        <h2>Change Password</h2>
        <form @submit.prevent="handlePasswordChange" class="settings-form">
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input
              id="newPassword"
              v-model="passwordData.newPassword"
              type="password"
              placeholder="New password"
              :disabled="passwordLoading"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="passwordData.confirmPassword"
              type="password"
              placeholder="Confirm password"
              :disabled="passwordLoading"
            />
          </div>

          <div v-if="passwordError" class="error-message">
            {{ passwordError }}
          </div>

          <div v-if="passwordSuccess" class="success-message">
            {{ passwordSuccess }}
          </div>

          <button type="submit" class="submit-btn" :disabled="passwordLoading">
            {{ passwordLoading ? 'Changing...' : 'Change Password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, initAuth } = useAuth()

const formData = ref({
  email: '',
  username: '',
  name: '',
  surname: '',
  profilePicture: ''
})

const passwordData = ref({
  newPassword: '',
  confirmPassword: ''
})

const loading = ref(false)
const passwordLoading = ref(false)
const uploadingProfilePicture = ref(false)
const error = ref('')
const success = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')

// Load user data on mount
onMounted(async () => {
  await initAuth()
  if (user.value) {
    formData.value = {
      email: user.value.email || '',
      username: user.value.username || '',
      name: user.value.name || '',
      surname: user.value.surname || '',
      profilePicture: user.value.profilePicture || ''
    }
  }
})

const handleProfilePictureUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  uploadingProfilePicture.value = true
  error.value = ''

  try {
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    const response = await $fetch<any>('/api/admin/upload-sprite?type=profile', {
      method: 'POST',
      body: formDataUpload,
    })

    formData.value.profilePicture = response.data.path
  } catch (err: any) {
    error.value = err.data?.statusMessage || err.message || 'Failed to upload profile picture'
  } finally {
    uploadingProfilePicture.value = false
  }
}

const removeProfilePicture = () => {
  formData.value.profilePicture = ''
  const fileInput = document.getElementById('profile-picture') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

const handleSubmit = async () => {
  if (!user.value) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await $fetch(`/api/users/${user.value.id}`, {
      method: 'PATCH',
      body: {
        email: formData.value.email,
        username: formData.value.username,
        name: formData.value.name || null,
        surname: formData.value.surname || null,
        profilePicture: formData.value.profilePicture || null
      }
    })

    success.value = 'Profile updated successfully!'

    // Refresh auth state to update user data
    await initAuth()

    // Clear success message after 3 seconds
    setTimeout(() => {
      success.value = ''
    }, 3000)
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'An error occurred while updating profile'
  } finally {
    loading.value = false
  }
}

const handlePasswordChange = async () => {
  if (!user.value) return

  passwordLoading.value = true
  passwordError.value = ''
  passwordSuccess.value = ''

  // Validate passwords
  if (passwordData.value.newPassword.length < 6) {
    passwordError.value = 'Password must be at least 6 characters long'
    passwordLoading.value = false
    return
  }

  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    passwordError.value = 'Passwords do not match'
    passwordLoading.value = false
    return
  }

  try {
    await $fetch(`/api/users/${user.value.id}/password`, {
      method: 'PATCH',
      body: {
        password: passwordData.value.newPassword
      }
    })

    passwordSuccess.value = 'Password changed successfully!'

    // Clear password fields
    passwordData.value.newPassword = ''
    passwordData.value.confirmPassword = ''

    // Clear success message after 3 seconds
    setTimeout(() => {
      passwordSuccess.value = ''
    }, 3000)
  } catch (err: any) {
    passwordError.value = err.data?.statusMessage || 'An error occurred while changing password'
  } finally {
    passwordLoading.value = false
  }
}
</script>

<style scoped src="~/assets/css/settings.css"></style>
