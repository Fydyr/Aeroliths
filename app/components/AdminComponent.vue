<template>
  <div class="admin-container">

    <!-- Check if user is admin -->
    <div v-if="!isAdmin" class="unauthorized">
      <h1>Access Denied</h1>
      <p>You do not have permission to access this page.</p>
      <button @click="navigateTo('/')">Go Home</button>
    </div>

    <!-- Admin Panel -->
    <div v-else class="admin-panel">
      <h1>Admin Panel</h1>

      <!-- Tab Navigation -->
      <div class="tabs">
        <button
          :class="{ active: activeTab === 'users' }"
          @click="activeTab = 'users'"
        >
          User Management
        </button>
        <button
          :class="{ active: activeTab === 'lithos' }"
          @click="activeTab = 'lithos'"
        >
          Lithos Management
        </button>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <h2>User Management</h2>

        <!-- Loading State -->
        <div v-if="usersLoading" class="loading">Loading users...</div>

        <!-- Error State -->
        <div v-if="usersError" class="error-message">{{ usersError }}</div>

        <!-- Success Message -->
        <div v-if="usersSuccess" class="success-message">{{ usersSuccess }}</div>

        <!-- Users Table -->
        <div v-if="!usersLoading && users.length > 0" class="users-table">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="userItem in users" :key="userItem.id">
                <td>{{ userItem.username }}</td>
                <td>{{ userItem.email }}</td>
                <td>{{ userItem.name || '-' }} {{ userItem.surname || '' }}</td>
                <td>
                  <span :class="['role-badge', userItem.role.name]">
                    {{ userItem.role.name }}
                  </span>
                </td>
                <td>{{ formatDate(userItem.createdAt) }}</td>
                <td class="actions">
                  <button
                    v-if="userItem.id !== user?.id"
                    @click="openEditUserModal(userItem)"
                    class="btn-edit"
                    :disabled="actionLoading"
                  >
                    Edit
                  </button>
                  <button
                    v-if="userItem.id !== user?.id && userItem.role.name !== 'admin'"
                    @click="toggleUserRole(userItem)"
                    class="btn-role"
                    :disabled="actionLoading"
                  >
                    {{ userItem.role.name === 'user' ? 'Make Admin' : 'Remove Admin' }}
                  </button>
                  <button
                    v-if="userItem.id !== user?.id && userItem.role.name !== 'admin'"
                    @click="deleteUser(userItem)"
                    class="btn-delete"
                    :disabled="actionLoading"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- No Users -->
        <div v-if="!usersLoading && users.length === 0" class="no-data">
          No users found.
        </div>
      </div>

      <!-- Lithos Tab -->
      <div v-if="activeTab === 'lithos'" class="tab-content">
        <h2>Lithos Management</h2>

        <button @click="openCreateLithosModal" class="btn-create">
          Create New Lithos
        </button>

        <!-- Loading State -->
        <div v-if="lithosLoading" class="loading">Loading lithos...</div>

        <!-- Error State -->
        <div v-if="lithosError" class="error-message">{{ lithosError }}</div>

        <!-- Success Message -->
        <div v-if="lithosSuccess" class="success-message">{{ lithosSuccess }}</div>

        <!-- Lithos Grid -->
        <div v-if="!lithosLoading && lithosList.length > 0" class="lithos-grid">
          <div v-for="lithos in lithosList" :key="lithos.id" class="lithos-card">
            <div class="lithos-sprite">
              <img :src="lithos.sprite" :alt="lithos.name" />
            </div>
            <h3>{{ lithos.name }}</h3>
            <p class="lithos-type">Type: {{ lithos.type }}</p>
            <div class="lithos-spikes">
              <span>⬆️ {{ lithos.spikeUp }}</span>
              <span>➡️ {{ lithos.spikeRight }}</span>
              <span>⬇️ {{ lithos.spikeDown }}</span>
              <span>⬅️ {{ lithos.spikeLeft }}</span>
            </div>
            <div class="lithos-actions">
              <button
                @click="openEditLithosModal(lithos)"
                class="btn-edit"
                :disabled="actionLoading"
              >
                Edit
              </button>
              <button
                @click="deleteLithos(lithos)"
                class="btn-delete"
                :disabled="actionLoading"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- No Lithos -->
        <div v-if="!lithosLoading && lithosList.length === 0" class="no-data">
          No lithos found.
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditUserModal" class="modal-overlay" @click="closeEditUserModal">
      <div class="modal" @click.stop>
        <h3>Edit User</h3>
        <form @submit.prevent="updateUser">
          <div class="form-group">
            <label for="edit-username">Username</label>
            <input
              id="edit-username"
              v-model="editUserForm.username"
              type="text"
              required
            />
          </div>
          <div class="form-group">
            <label for="edit-email">Email</label>
            <input
              id="edit-email"
              v-model="editUserForm.email"
              type="email"
              required
            />
          </div>
          <div class="form-group">
            <label for="edit-name">Name</label>
            <input
              id="edit-name"
              v-model="editUserForm.name"
              type="text"
            />
          </div>
          <div class="form-group">
            <label for="edit-surname">Surname</label>
            <input
              id="edit-surname"
              v-model="editUserForm.surname"
              type="text"
            />
          </div>
          <div v-if="modalError" class="error-message">{{ modalError }}</div>
          <div class="modal-actions">
            <button type="button" @click="closeEditUserModal" :disabled="modalLoading">
              Cancel
            </button>
            <button type="submit" :disabled="modalLoading">
              {{ modalLoading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Create/Edit Lithos Modal -->
    <div v-if="showLithosModal" class="modal-overlay" @click="closeLithosModal">
      <div class="modal" @click.stop>
        <h3>{{ lithosForm.id ? 'Edit Lithos' : 'Create Lithos' }}</h3>
        <form @submit.prevent="saveLithos">
          <div class="form-group">
            <label for="lithos-name">Name</label>
            <input
              id="lithos-name"
              v-model="lithosForm.name"
              type="text"
              required
            />
          </div>
          <div class="form-group">
            <label for="lithos-sprite">Sprite Image</label>
            <input
              id="lithos-sprite"
              type="file"
              accept="image/*"
              @change="handleSpriteUpload"
              :required="!lithosForm.sprite"
            />
            <div v-if="uploadingSprite" class="upload-loading">Uploading image...</div>
            <div v-if="lithosForm.sprite" class="sprite-preview">
              <img :src="lithosForm.sprite" alt="Sprite preview" />
              <button type="button" @click="removeSprite" class="btn-remove-sprite">Remove</button>
            </div>
          </div>
          <div class="form-group">
            <label for="lithos-type">Type</label>
            <input
              id="lithos-type"
              v-model="lithosForm.type"
              type="text"
              required
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="spike-up">Spike Up</label>
              <input
                id="spike-up"
                v-model.number="lithosForm.spikeUp"
                type="number"
                min="0"
                required
              />
            </div>
            <div class="form-group">
              <label for="spike-right">Spike Right</label>
              <input
                id="spike-right"
                v-model.number="lithosForm.spikeRight"
                type="number"
                min="0"
                required
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="spike-down">Spike Down</label>
              <input
                id="spike-down"
                v-model.number="lithosForm.spikeDown"
                type="number"
                min="0"
                required
              />
            </div>
            <div class="form-group">
              <label for="spike-left">Spike Left</label>
              <input
                id="spike-left"
                v-model.number="lithosForm.spikeLeft"
                type="number"
                min="0"
                required
              />
            </div>
          </div>
          <div v-if="modalError" class="error-message">{{ modalError }}</div>
          <div class="modal-actions">
            <button type="button" @click="closeLithosModal" :disabled="modalLoading">
              Cancel
            </button>
            <button type="submit" :disabled="modalLoading">
              {{ modalLoading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, token, initAuth } = useAuth()

// Check if user is admin
const isAdmin = computed(() => user.value?.role?.name === 'admin')

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  if (!token.value) return {}
  return {
    Authorization: `Bearer ${token.value}`
  }
}

// Tab management
const activeTab = ref<'users' | 'lithos'>('users')

// Users management
const users = ref<any[]>([])
const usersLoading = ref(false)
const usersError = ref('')
const usersSuccess = ref('')

// Lithos management
const lithosList = ref<any[]>([])
const lithosLoading = ref(false)
const lithosError = ref('')
const lithosSuccess = ref('')

// Action loading
const actionLoading = ref(false)

// Edit user modal
const showEditUserModal = ref(false)
const editUserForm = ref({
  id: '',
  username: '',
  email: '',
  name: '',
  surname: '',
})
const modalLoading = ref(false)
const modalError = ref('')

// Lithos modal
const showLithosModal = ref(false)
const lithosForm = ref({
  id: '',
  name: '',
  sprite: '',
  type: '',
  spikeUp: 0,
  spikeRight: 0,
  spikeDown: 0,
  spikeLeft: 0,
})
const uploadingSprite = ref(false)

// Handle sprite image upload
const handleSpriteUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  uploadingSprite.value = true
  modalError.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch<any>('/api/admin/upload-sprite', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    })

    lithosForm.value.sprite = response.data.path
  } catch (error: any) {
    modalError.value = error.data?.statusMessage || 'Failed to upload sprite'
  } finally {
    uploadingSprite.value = false
  }
}

// Remove sprite
const removeSprite = () => {
  lithosForm.value.sprite = ''
  const fileInput = document.getElementById('lithos-sprite') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

// Fetch all users
const fetchUsers = async () => {
  usersLoading.value = true
  usersError.value = ''

  try {
    const response = await $fetch<any>('/api/admin/users', {
      headers: getAuthHeaders()
    })
    users.value = response.data.users
  } catch (error: any) {
    usersError.value = error.data?.statusMessage || 'Failed to load users'
  } finally {
    usersLoading.value = false
  }
}

// Fetch all lithos
const fetchLithos = async () => {
  lithosLoading.value = true
  lithosError.value = ''

  try {
    const response = await $fetch<any>('/api/lithos')
    lithosList.value = response.data
  } catch (error: any) {
    lithosError.value = error.data?.statusMessage || 'Failed to load lithos'
  } finally {
    lithosLoading.value = false
  }
}

// Open edit user modal
const openEditUserModal = (userItem: any) => {
  editUserForm.value = {
    id: userItem.id,
    username: userItem.username,
    email: userItem.email,
    name: userItem.name || '',
    surname: userItem.surname || '',
  }
  modalError.value = ''
  showEditUserModal.value = true
}

// Close edit user modal
const closeEditUserModal = () => {
  showEditUserModal.value = false
  editUserForm.value = {
    id: '',
    username: '',
    email: '',
    name: '',
    surname: '',
  }
  modalError.value = ''
}

// Update user
const updateUser = async () => {
  modalLoading.value = true
  modalError.value = ''

  try {
    await $fetch(`/api/users/${editUserForm.value.id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: {
        username: editUserForm.value.username,
        email: editUserForm.value.email,
        name: editUserForm.value.name || null,
        surname: editUserForm.value.surname || null,
      },
    })

    usersSuccess.value = 'User updated successfully'
    closeEditUserModal()
    await fetchUsers()
    setTimeout(() => { usersSuccess.value = '' }, 3000)
  } catch (error: any) {
    modalError.value = error.data?.statusMessage || 'Failed to update user'
  } finally {
    modalLoading.value = false
  }
}

// Toggle user role
const toggleUserRole = async (userItem: any) => {
  if (!confirm(`Are you sure you want to ${userItem.role.name === 'user' ? 'promote' : 'demote'} ${userItem.username}?`)) {
    return
  }

  actionLoading.value = true
  usersError.value = ''

  try {
    const newRole = userItem.role.name === 'user' ? 'admin' : 'user'
    await $fetch(`/api/admin/users/${userItem.id}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: { roleName: newRole },
    })

    usersSuccess.value = `User role updated successfully`
    await fetchUsers()
    setTimeout(() => { usersSuccess.value = '' }, 3000)
  } catch (error: any) {
    usersError.value = error.data?.statusMessage || 'Failed to update user role'
  } finally {
    actionLoading.value = false
  }
}

// Delete user
const deleteUser = async (userItem: any) => {
  if (!confirm(`Are you sure you want to delete ${userItem.username}? This action cannot be undone.`)) {
    return
  }

  actionLoading.value = true
  usersError.value = ''

  try {
    await $fetch(`/api/admin/users/${userItem.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    usersSuccess.value = `User ${userItem.username} deleted successfully`
    await fetchUsers()
    setTimeout(() => { usersSuccess.value = '' }, 3000)
  } catch (error: any) {
    usersError.value = error.data?.statusMessage || 'Failed to delete user'
  } finally {
    actionLoading.value = false
  }
}

// Open create lithos modal
const openCreateLithosModal = () => {
  lithosForm.value = {
    id: '',
    name: '',
    sprite: '',
    type: '',
    spikeUp: 0,
    spikeRight: 0,
    spikeDown: 0,
    spikeLeft: 0,
  }
  modalError.value = ''
  showLithosModal.value = true
}

// Open edit lithos modal
const openEditLithosModal = (lithos: any) => {
  lithosForm.value = {
    id: lithos.id,
    name: lithos.name,
    sprite: lithos.sprite,
    type: lithos.type,
    spikeUp: lithos.spikeUp,
    spikeRight: lithos.spikeRight,
    spikeDown: lithos.spikeDown,
    spikeLeft: lithos.spikeLeft,
  }
  modalError.value = ''
  showLithosModal.value = true
}

// Close lithos modal
const closeLithosModal = () => {
  showLithosModal.value = false
  lithosForm.value = {
    id: '',
    name: '',
    sprite: '',
    type: '',
    spikeUp: 0,
    spikeRight: 0,
    spikeDown: 0,
    spikeLeft: 0,
  }
  modalError.value = ''
}

// Save lithos (create or update)
const saveLithos = async () => {
  modalLoading.value = true
  modalError.value = ''

  try {
    if (lithosForm.value.id) {
      // Update existing lithos
      await $fetch(`/api/lithos/${lithosForm.value.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: {
          name: lithosForm.value.name,
          sprite: lithosForm.value.sprite,
          type: lithosForm.value.type,
          spikeUp: lithosForm.value.spikeUp,
          spikeRight: lithosForm.value.spikeRight,
          spikeDown: lithosForm.value.spikeDown,
          spikeLeft: lithosForm.value.spikeLeft,
        },
      })
      lithosSuccess.value = 'Lithos updated successfully'
    } else {
      // Create new lithos
      await $fetch('/api/lithos', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: {
          name: lithosForm.value.name,
          sprite: lithosForm.value.sprite,
          type: lithosForm.value.type,
          spikeUp: lithosForm.value.spikeUp,
          spikeRight: lithosForm.value.spikeRight,
          spikeDown: lithosForm.value.spikeDown,
          spikeLeft: lithosForm.value.spikeLeft,
        },
      })
      lithosSuccess.value = 'Lithos created successfully'
    }

    closeLithosModal()
    await fetchLithos()
    setTimeout(() => { lithosSuccess.value = '' }, 3000)
  } catch (error: any) {
    modalError.value = error.data?.statusMessage || 'Failed to save lithos'
  } finally {
    modalLoading.value = false
  }
}

// Delete lithos
const deleteLithos = async (lithos: any) => {
  if (!confirm(`Are you sure you want to delete ${lithos.name}? This action cannot be undone.`)) {
    return
  }

  actionLoading.value = true
  lithosError.value = ''

  try {
    await $fetch(`/api/admin/lithos/${lithos.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    lithosSuccess.value = `Lithos ${lithos.name} deleted successfully`
    await fetchLithos()
    setTimeout(() => { lithosSuccess.value = '' }, 3000)
  } catch (error: any) {
    lithosError.value = error.data?.statusMessage || 'Failed to delete lithos'
  } finally {
    actionLoading.value = false
  }
}

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// Initialize
onMounted(async () => {
  await initAuth()

  // Redirect if not admin
  if (!isAdmin.value) {
    return
  }

  // Fetch initial data
  await fetchUsers()
  await fetchLithos()
})
</script>

<style scoped src="~/assets/css/admin.css"></style>
