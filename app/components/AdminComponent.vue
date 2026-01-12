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
          :class="{ active: activeTab === 'elements' }"
          @click="activeTab = 'elements'"
        >
          Elements Management
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

        <!-- Search Bar -->
        <div class="search-bar">
          <input
            v-model="userSearchQuery"
            type="text"
            placeholder="Search users by username, email, or name..."
            class="search-input"
          />
          <span class="search-icon">🔍</span>
        </div>

        <!-- Loading State -->
        <div v-if="usersLoading" class="loading">Loading users...</div>

        <!-- Error State -->
        <div v-if="usersError" class="error-message">{{ usersError }}</div>

        <!-- Success Message -->
        <div v-if="usersSuccess" class="success-message">{{ usersSuccess }}</div>

        <!-- Users Table -->
        <div v-if="!usersLoading && filteredUsers.length > 0" class="users-table">
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
              <tr v-for="userItem in filteredUsers" :key="userItem.id">
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
                    v-if="userItem.id !== user?.id"
                    @click="toggleUserRole(userItem)"
                    class="btn-role"
                    :disabled="actionLoading"
                  >
                    {{ userItem.role.name === 'user' ? 'Make Admin' : 'Remove Admin' }}
                  </button>
                  <button
                    v-if="userItem.id !== user?.id"
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
        <div v-if="!usersLoading && filteredUsers.length === 0 && userSearchQuery === ''" class="no-data">
          No users found.
        </div>
        <div v-if="!usersLoading && filteredUsers.length === 0 && userSearchQuery !== ''" class="no-data">
          No users match your search.
        </div>
      </div>

      <!-- Elements Tab -->
      <div v-if="activeTab === 'elements'" class="tab-content">
        <h2>Elements Management</h2>

        <div class="lithos-header">
          <button @click="openCreateElementModal" class="btn-create">
            Create New Element
          </button>

          <!-- Search Bar -->
          <div class="search-bar">
            <input
              v-model="elementsSearchQuery"
              type="text"
              placeholder="Search elements by name..."
              class="search-input"
            />
            <span class="search-icon">🔍</span>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="elementsLoading" class="loading">Loading elements...</div>

        <!-- Error State -->
        <div v-if="elementsError" class="error-message">{{ elementsError }}</div>

        <!-- Success Message -->
        <div v-if="elementsSuccess" class="success-message">{{ elementsSuccess }}</div>

        <!-- Elements Grid -->
        <div v-if="!elementsLoading && filteredElements.length > 0" class="lithos-grid">
          <div v-for="element in filteredElements" :key="element.id" class="lithos-card">
            <div class="lithos-sprite">
              <img :src="element.sprite" :alt="element.name" />
            </div>
            <h3>{{ element.name }}</h3>
            <div class="element-relations">
              <p v-if="element.weaknessesFrom && element.weaknessesFrom.length > 0" class="element-weaknesses">
                <strong>Weak against:</strong> {{ element.weaknessesFrom.map((w: any) => w.weakAgainst.name).join(', ') }}
              </p>
              <p v-if="element.strengthsFrom && element.strengthsFrom.length > 0" class="element-strengths">
                <strong>Strong against:</strong> {{ element.strengthsFrom.map((s: any) => s.strongAgainst.name).join(', ') }}
              </p>
            </div>
            <div class="lithos-actions">
              <button
                @click="openEditElementModal(element)"
                class="btn-edit"
                :disabled="actionLoading"
              >
                Edit
              </button>
              <button
                @click="manageElementRelations(element)"
                class="btn-role"
                :disabled="actionLoading"
              >
                Relations
              </button>
              <button
                @click="deleteElement(element)"
                class="btn-delete"
                :disabled="actionLoading"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- No Elements -->
        <div v-if="!elementsLoading && filteredElements.length === 0 && elementsSearchQuery === ''" class="no-data">
          No elements found.
        </div>
        <div v-if="!elementsLoading && filteredElements.length === 0 && elementsSearchQuery !== ''" class="no-data">
          No elements match your search.
        </div>
      </div>

      <!-- Lithos Tab -->
      <div v-if="activeTab === 'lithos'" class="tab-content">
        <h2>Lithos Management</h2>

        <div class="lithos-header">
          <button @click="openCreateLithosModal" class="btn-create">
            Create New Lithos
          </button>

          <!-- Search Bar -->
          <div class="search-bar">
            <input
              v-model="lithosSearchQuery"
              type="text"
              placeholder="Search lithos by name or type..."
              class="search-input"
            />
            <span class="search-icon">🔍</span>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="lithosLoading" class="loading">Loading lithos...</div>

        <!-- Error State -->
        <div v-if="lithosError" class="error-message">{{ lithosError }}</div>

        <!-- Success Message -->
        <div v-if="lithosSuccess" class="success-message">{{ lithosSuccess }}</div>

        <!-- Lithos Grid -->
        <div v-if="!lithosLoading && filteredLithos.length > 0" class="lithos-grid">
          <div v-for="lithos in filteredLithos" :key="lithos.id" class="lithos-card">
            <div class="lithos-sprite">
              <img :src="lithos.sprite" :alt="lithos.name" />
            </div>
            <h3>{{ lithos.name }}</h3>
            <p class="lithos-type">Rarity: {{ lithos.rarity }}</p>
            <p v-if="lithos.element" class="lithos-element">Element: {{ lithos.element.name }}</p>
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
        <div v-if="!lithosLoading && filteredLithos.length === 0 && lithosSearchQuery === ''" class="no-data">
          No lithos found.
        </div>
        <div v-if="!lithosLoading && filteredLithos.length === 0 && lithosSearchQuery !== ''" class="no-data">
          No lithos match your search.
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditUserModal" class="modal-overlay" @click="closeEditUserModal">
      <div class="modal" @click.stop>
        <h3>Edit User</h3>
        <form @submit.prevent="updateUser">
          <!-- Profile Picture -->
          <div class="form-group">
            <label for="edit-profile-picture">Profile Picture</label>
            <div class="profile-picture-upload">
              <div v-if="editUserForm.profilePicture" class="profile-picture-preview">
                <img :src="editUserForm.profilePicture" alt="Profile picture" />
                <button
                  type="button"
                  @click="removeUserProfilePicture"
                  class="remove-btn"
                  :disabled="modalLoading"
                >
                  Remove
                </button>
              </div>
              <div v-else class="profile-picture-placeholder">
                <span>No profile picture</span>
              </div>
              <input
                id="edit-profile-picture"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                @change="handleUserProfilePictureUpload"
                :disabled="modalLoading || uploadingUserProfilePicture"
              />
              <span v-if="uploadingUserProfilePicture" class="uploading-text">Uploading...</span>
            </div>
          </div>

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

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="cancelConfirm">
      <div class="modal modal-confirm" @click.stop>
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="modal-actions">
          <button type="button" @click="cancelConfirm" :disabled="confirmLoading">
            Cancel
          </button>
          <button
            type="button"
            @click="confirmAction"
            :disabled="confirmLoading"
            :class="confirmDanger ? 'btn-danger' : ''"
          >
            {{ confirmLoading ? 'Processing...' : confirmButtonText }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Element Modal -->
    <div v-if="showElementModal" class="modal-overlay" @click="closeElementModal">
      <div class="modal" @click.stop>
        <h3>{{ elementForm.id ? 'Edit Element' : 'Create Element' }}</h3>
        <form @submit.prevent="saveElement">
          <div class="form-group">
            <label for="element-name">Name</label>
            <input
              id="element-name"
              v-model="elementForm.name"
              type="text"
              required
            />
          </div>
          <div class="form-group">
            <label for="element-sprite">Sprite Image</label>
            <input
              id="element-sprite"
              type="file"
              accept="image/*"
              @change="handleElementSpriteUpload"
              :required="!elementForm.sprite"
              style="display: block; width: 100%; padding: 8px; margin-top: 4px;"
            />
            <div v-if="uploadingElementSprite" class="upload-loading">Uploading image...</div>
            <div v-if="elementForm.sprite" class="sprite-preview">
              <img :src="elementForm.sprite" alt="Sprite preview" />
              <button type="button" @click="removeElementSprite" class="btn-remove-sprite">Remove</button>
            </div>
          </div>
          <div class="form-group" v-if="!elementForm.id">
            <label for="element-weaknesses">Weaknesses (Optional)</label>
            <select
              id="element-weaknesses"
              v-model="elementForm.weaknesses"
              multiple
              style="min-height: 80px;"
            >
              <option
                v-for="element in availableElementsForRelations"
                :key="element.id"
                :value="element.id"
              >
                {{ element.name }}
              </option>
            </select>
            <small style="display: block; margin-top: 4px; color: #888;">Hold Ctrl/Cmd to select multiple</small>
          </div>
          <div class="form-group" v-if="!elementForm.id">
            <label for="element-strengths">Strengths (Optional)</label>
            <select
              id="element-strengths"
              v-model="elementForm.strengths"
              multiple
              style="min-height: 80px;"
            >
              <option
                v-for="element in availableElementsForRelations"
                :key="element.id"
                :value="element.id"
              >
                {{ element.name }}
              </option>
            </select>
            <small style="display: block; margin-top: 4px; color: #888;">Hold Ctrl/Cmd to select multiple</small>
          </div>
          <div v-if="modalError" class="error-message">{{ modalError }}</div>
          <div class="modal-actions">
            <button type="button" @click="closeElementModal" :disabled="modalLoading">
              Cancel
            </button>
            <button type="submit" :disabled="modalLoading">
              {{ modalLoading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Element Relations Modal -->
    <div v-if="showElementRelationsModal" class="modal-overlay" @click="closeElementRelationsModal">
      <div class="modal modal-large" @click.stop>
        <h3>Manage Relations for {{ selectedElement?.name }}</h3>

        <!-- Weaknesses Section -->
        <div class="relations-section">
          <h4>Weaknesses (Weak Against)</h4>
          <div class="relations-list">
            <div v-for="weakness in selectedElementWeaknesses" :key="weakness.id" class="relation-item">
              <span>{{ weakness.weakAgainst.name }}</span>
              <button
                @click="deleteWeakness(weakness.id)"
                class="btn-delete-small"
                :disabled="relationLoading"
              >
                Remove
              </button>
            </div>
            <div v-if="selectedElementWeaknesses.length === 0" class="no-relations">
              No weaknesses defined
            </div>
          </div>
          <div class="add-relation">
            <select v-model="newWeaknessId" class="relation-select">
              <option value="">-- Select an element --</option>
              <option
                v-for="el in availableWeaknessElements"
                :key="el.id"
                :value="el.id"
              >
                {{ el.name }}
              </option>
            </select>
            <button
              @click="addWeakness"
              class="btn-add"
              :disabled="!newWeaknessId || relationLoading"
            >
              Add Weakness
            </button>
          </div>
        </div>

        <!-- Strengths Section -->
        <div class="relations-section">
          <h4>Strengths (Strong Against)</h4>
          <div class="relations-list">
            <div v-for="strength in selectedElementStrengths" :key="strength.id" class="relation-item">
              <span>{{ strength.strongAgainst.name }}</span>
              <button
                @click="deleteStrength(strength.id)"
                class="btn-delete-small"
                :disabled="relationLoading"
              >
                Remove
              </button>
            </div>
            <div v-if="selectedElementStrengths.length === 0" class="no-relations">
              No strengths defined
            </div>
          </div>
          <div class="add-relation">
            <select v-model="newStrengthId" class="relation-select">
              <option value="">-- Select an element --</option>
              <option
                v-for="el in availableStrengthElements"
                :key="el.id"
                :value="el.id"
              >
                {{ el.name }}
              </option>
            </select>
            <button
              @click="addStrength"
              class="btn-add"
              :disabled="!newStrengthId || relationLoading"
            >
              Add Strength
            </button>
          </div>
        </div>

        <div v-if="relationsError" class="error-message">{{ relationsError }}</div>
        <div v-if="relationsSuccess" class="success-message">{{ relationsSuccess }}</div>

        <div class="modal-actions">
          <button type="button" @click="closeElementRelationsModal">
            Close
          </button>
        </div>
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
              style="display: block; width: 100%; padding: 8px; margin-top: 4px;"
            />
            <div v-if="uploadingSprite" class="upload-loading">Uploading image...</div>
            <div v-if="lithosForm.sprite" class="sprite-preview">
              <img :src="lithosForm.sprite" alt="Sprite preview" />
              <button type="button" @click="removeSprite" class="btn-remove-sprite">Remove</button>
            </div>
          </div>
          <div class="form-group">
            <label for="lithos-element">Element (Optional)</label>
            <select
              id="lithos-element"
              v-model="lithosForm.elementId"
            >
              <option value="">-- No Element --</option>
              <option
                v-for="element in elementsList"
                :key="element.id"
                :value="element.id"
              >
                {{ element.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="lithos-rarity">Rarity</label>
            <select
              id="lithos-rarity"
              v-model="lithosForm.rarity"
              required
            >
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
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

// Filtered users based on search query
const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return users.value

  const query = userSearchQuery.value.toLowerCase()
  return users.value.filter((userItem) => {
    const username = userItem.username?.toLowerCase() || ''
    const email = userItem.email?.toLowerCase() || ''
    const name = userItem.name?.toLowerCase() || ''
    const surname = userItem.surname?.toLowerCase() || ''
    const fullName = `${name} ${surname}`.trim()

    return (
      username.includes(query) ||
      email.includes(query) ||
      name.includes(query) ||
      surname.includes(query) ||
      fullName.includes(query)
    )
  })
})

// Filtered elements based on search query
const filteredElements = computed(() => {
  if (!elementsSearchQuery.value) return elementsList.value

  const query = elementsSearchQuery.value.toLowerCase()
  return elementsList.value.filter((element) => {
    const name = element.name?.toLowerCase() || ''
    return name.includes(query)
  })
})

// Filtered lithos based on search query
const filteredLithos = computed(() => {
  if (!lithosSearchQuery.value) return lithosList.value

  const query = lithosSearchQuery.value.toLowerCase()
  return lithosList.value.filter((lithos) => {
    const name = lithos.name?.toLowerCase() || ''
    const rarity = lithos.rarity?.toLowerCase() || ''

    return name.includes(query) || rarity.includes(query)
  })
})

// Available elements for relations (all elements when creating, exclude current when editing)
const availableElementsForRelations = computed(() => {
  if (!elementForm.value.id) {
    return elementsList.value
  }
  return elementsList.value.filter(el => el.id !== elementForm.value.id)
})

// Available elements for weaknesses (excluding self and already added)
const availableWeaknessElements = computed(() => {
  if (!selectedElement.value) return []

  const existingIds = selectedElementWeaknesses.value.map((w: any) => w.weakAgainstId)
  return elementsList.value.filter(
    el => el.id !== selectedElement.value!.id && !existingIds.includes(el.id)
  )
})

// Available elements for strengths (excluding self and already added)
const availableStrengthElements = computed(() => {
  if (!selectedElement.value) return []

  const existingIds = selectedElementStrengths.value.map((s: any) => s.strongAgainstId)
  return elementsList.value.filter(
    el => el.id !== selectedElement.value!.id && !existingIds.includes(el.id)
  )
})

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  if (!token.value) return {}
  return {
    Authorization: `Bearer ${token.value}`
  }
}

// Tab management
const activeTab = ref<'users' | 'elements' | 'lithos'>('users')

// Users management
const users = ref<any[]>([])
const usersLoading = ref(false)
const usersError = ref('')
const usersSuccess = ref('')
const userSearchQuery = ref('')

// Elements management
const elementsList = ref<any[]>([])
const elementsLoading = ref(false)
const elementsError = ref('')
const elementsSuccess = ref('')
const elementsSearchQuery = ref('')

// Lithos management
const lithosList = ref<any[]>([])
const lithosLoading = ref(false)
const lithosError = ref('')
const lithosSuccess = ref('')
const lithosSearchQuery = ref('')

// Action loading
const actionLoading = ref(false)

// Confirmation modal
const showConfirmModal = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmButtonText = ref('Confirm')
const confirmDanger = ref(false)
const confirmLoading = ref(false)
const confirmCallback = ref<(() => Promise<void>) | null>(null)

// Edit user modal
const showEditUserModal = ref(false)
const editUserForm = ref({
  id: '',
  username: '',
  email: '',
  name: '',
  surname: '',
  profilePicture: '',
})
const uploadingUserProfilePicture = ref(false)
const modalLoading = ref(false)
const modalError = ref('')

// Element modal
const showElementModal = ref(false)
const elementForm = ref({
  id: '',
  name: '',
  sprite: '',
  weaknesses: [] as string[],
  strengths: [] as string[],
})
const uploadingElementSprite = ref(false)

// Element relations modal
const showElementRelationsModal = ref(false)
const selectedElement = ref<any>(null)
const selectedElementWeaknesses = ref<any[]>([])
const selectedElementStrengths = ref<any[]>([])
const newWeaknessId = ref('')
const newStrengthId = ref('')
const relationLoading = ref(false)
const relationsError = ref('')
const relationsSuccess = ref('')

// Lithos modal
const showLithosModal = ref(false)
const lithosForm = ref({
  id: '',
  name: '',
  sprite: '',
  rarity: 'common',
  elementId: '',
  spikeUp: 0,
  spikeRight: 0,
  spikeDown: 0,
  spikeLeft: 0,
})
const uploadingSprite = ref(false)

// Open confirmation modal
const openConfirmModal = (
  title: string,
  message: string,
  callback: () => Promise<void>,
  buttonText: string = 'Confirm',
  danger: boolean = false
) => {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmButtonText.value = buttonText
  confirmDanger.value = danger
  confirmCallback.value = callback
  showConfirmModal.value = true
}

// Cancel confirmation
const cancelConfirm = () => {
  showConfirmModal.value = false
  confirmCallback.value = null
  confirmLoading.value = false
}

// Confirm action
const confirmAction = async () => {
  if (!confirmCallback.value) return

  confirmLoading.value = true
  try {
    await confirmCallback.value()
    showConfirmModal.value = false
    confirmCallback.value = null
  } catch (error) {
    // Error is handled in the callback
  } finally {
    confirmLoading.value = false
  }
}

// Handle element sprite image upload
const handleElementSpriteUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  uploadingElementSprite.value = true
  modalError.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)

    // Use $fetch with FormData - Nuxt handles cookies automatically for same-origin requests
    const response = await $fetch<any>('/api/admin/upload-sprite?type=elements', {
      method: 'POST',
      body: formData,
    })

    elementForm.value.sprite = response.data.path
  } catch (error: any) {
    modalError.value = error.data?.statusMessage || error.message || 'Failed to upload sprite'
  } finally {
    uploadingElementSprite.value = false
  }
}

// Remove element sprite
const removeElementSprite = () => {
  elementForm.value.sprite = ''
  const fileInput = document.getElementById('element-sprite') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

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

    // Use $fetch with FormData - Nuxt handles cookies automatically for same-origin requests
    const response = await $fetch<any>('/api/admin/upload-sprite?type=lithos', {
      method: 'POST',
      body: formData,
    })

    lithosForm.value.sprite = response.data.path
  } catch (error: any) {
    modalError.value = error.data?.statusMessage || error.message || 'Failed to upload sprite'
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

// Fetch all elements
const fetchElements = async () => {
  elementsLoading.value = true
  elementsError.value = ''

  try {
    const response = await $fetch<any>('/api/elements')
    elementsList.value = response.data
  } catch (error: any) {
    elementsError.value = error.data?.statusMessage || 'Failed to load elements'
  } finally {
    elementsLoading.value = false
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
    profilePicture: userItem.profilePicture || '',
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
    profilePicture: '',
  }
  modalError.value = ''
}

// Handle user profile picture upload (admin)
const handleUserProfilePictureUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  uploadingUserProfilePicture.value = true
  modalError.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch<any>('/api/admin/upload-sprite?type=profile', {
      method: 'POST',
      body: formData,
    })

    editUserForm.value.profilePicture = response.data.path
  } catch (error: any) {
    modalError.value = error.data?.statusMessage || error.message || 'Failed to upload profile picture'
  } finally {
    uploadingUserProfilePicture.value = false
  }
}

// Remove user profile picture (admin)
const removeUserProfilePicture = () => {
  editUserForm.value.profilePicture = ''
  const fileInput = document.getElementById('edit-profile-picture') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
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
        profilePicture: editUserForm.value.profilePicture || null,
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
const toggleUserRole = (userItem: any) => {
  const action = userItem.role.name === 'user' ? 'promote' : 'demote'
  const actionText = userItem.role.name === 'user' ? 'Make Admin' : 'Remove Admin'

  openConfirmModal(
    `${actionText}`,
    `Are you sure you want to ${action} ${userItem.username}?`,
    async () => {
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
        throw error
      } finally {
        actionLoading.value = false
      }
    },
    actionText,
    false
  )
}

// Delete user
const deleteUser = (userItem: any) => {
  openConfirmModal(
    'Delete User',
    `Are you sure you want to delete ${userItem.username}? This action cannot be undone.`,
    async () => {
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
        throw error
      } finally {
        actionLoading.value = false
      }
    },
    'Delete',
    true
  )
}

// Open create element modal
const openCreateElementModal = () => {
  elementForm.value = {
    id: '',
    name: '',
    sprite: '',
    weaknesses: [],
    strengths: [],
  }
  modalError.value = ''
  showElementModal.value = true
}

// Open edit element modal
const openEditElementModal = (element: any) => {
  elementForm.value = {
    id: element.id,
    name: element.name,
    sprite: element.sprite,
    weaknesses: [],
    strengths: [],
  }
  modalError.value = ''
  showElementModal.value = true
}

// Close element modal
const closeElementModal = () => {
  showElementModal.value = false
  elementForm.value = {
    id: '',
    name: '',
    sprite: '',
    weaknesses: [],
    strengths: [],
  }
  modalError.value = ''
}

// Save element (create or update)
const saveElement = async () => {
  modalLoading.value = true
  modalError.value = ''

  try {
    if (elementForm.value.id) {
      // Update existing element
      await $fetch(`/api/admin/elements/${elementForm.value.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: {
          name: elementForm.value.name,
          sprite: elementForm.value.sprite,
        },
      })
      elementsSuccess.value = 'Element updated successfully'
    } else {
      // Create new element
      const response = await $fetch<any>('/api/admin/elements', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: {
          name: elementForm.value.name,
          sprite: elementForm.value.sprite,
        },
      })

      const newElementId = response.data.id

      // Create weaknesses if any were selected
      if (elementForm.value.weaknesses.length > 0) {
        for (const weakAgainstId of elementForm.value.weaknesses) {
          try {
            await $fetch('/api/admin/weaknesses', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: {
                elementId: newElementId,
                weakAgainstId: weakAgainstId,
              },
            })
          } catch (error) {
            console.error('Failed to add weakness:', error)
          }
        }
      }

      // Create strengths if any were selected
      if (elementForm.value.strengths.length > 0) {
        for (const strongAgainstId of elementForm.value.strengths) {
          try {
            await $fetch('/api/admin/strengths', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: {
                elementId: newElementId,
                strongAgainstId: strongAgainstId,
              },
            })
          } catch (error) {
            console.error('Failed to add strength:', error)
          }
        }
      }

      elementsSuccess.value = 'Element created successfully'
    }

    closeElementModal()
    await fetchElements()
    setTimeout(() => { elementsSuccess.value = '' }, 3000)
  } catch (error: any) {
    modalError.value = error.data?.statusMessage || 'Failed to save element'
  } finally {
    modalLoading.value = false
  }
}

// Delete element
const deleteElement = (element: any) => {
  openConfirmModal(
    'Delete Element',
    `Are you sure you want to delete ${element.name}? This action cannot be undone.`,
    async () => {
      actionLoading.value = true
      elementsError.value = ''

      try {
        await $fetch(`/api/admin/elements/${element.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })

        elementsSuccess.value = `Element ${element.name} deleted successfully`
        await fetchElements()
        await fetchLithos() // Refresh lithos in case they were linked
        setTimeout(() => { elementsSuccess.value = '' }, 3000)
      } catch (error: any) {
        elementsError.value = error.data?.statusMessage || 'Failed to delete element'
        throw error
      } finally {
        actionLoading.value = false
      }
    },
    'Delete',
    true
  )
}

// Manage element relations
const manageElementRelations = (element: any) => {
  selectedElement.value = element
  selectedElementWeaknesses.value = element.weaknessesFrom || []
  selectedElementStrengths.value = element.strengthsFrom || []
  newWeaknessId.value = ''
  newStrengthId.value = ''
  relationsError.value = ''
  relationsSuccess.value = ''
  showElementRelationsModal.value = true
}

// Close element relations modal
const closeElementRelationsModal = () => {
  showElementRelationsModal.value = false
  selectedElement.value = null
  selectedElementWeaknesses.value = []
  selectedElementStrengths.value = []
  newWeaknessId.value = ''
  newStrengthId.value = ''
  relationsError.value = ''
  relationsSuccess.value = ''
}

// Add weakness
const addWeakness = async () => {
  if (!newWeaknessId.value || !selectedElement.value) return

  relationLoading.value = true
  relationsError.value = ''

  try {
    await $fetch('/api/admin/weaknesses', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: {
        elementId: selectedElement.value.id,
        weakAgainstId: newWeaknessId.value,
      },
    })

    relationsSuccess.value = 'Weakness added successfully'
    newWeaknessId.value = ''
    await fetchElements()

    // Update the selected element with fresh data
    const updatedElement = elementsList.value.find(e => e.id === selectedElement.value!.id)
    if (updatedElement) {
      selectedElement.value = updatedElement
      selectedElementWeaknesses.value = updatedElement.weaknessesFrom || []
    }

    setTimeout(() => { relationsSuccess.value = '' }, 3000)
  } catch (error: any) {
    relationsError.value = error.data?.statusMessage || 'Failed to add weakness'
  } finally {
    relationLoading.value = false
  }
}

// Delete weakness
const deleteWeakness = async (weaknessId: string) => {
  relationLoading.value = true
  relationsError.value = ''

  try {
    await $fetch(`/api/admin/weaknesses/${weaknessId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    relationsSuccess.value = 'Weakness removed successfully'
    await fetchElements()

    // Update the selected element with fresh data
    const updatedElement = elementsList.value.find(e => e.id === selectedElement.value!.id)
    if (updatedElement) {
      selectedElement.value = updatedElement
      selectedElementWeaknesses.value = updatedElement.weaknessesFrom || []
    }

    setTimeout(() => { relationsSuccess.value = '' }, 3000)
  } catch (error: any) {
    relationsError.value = error.data?.statusMessage || 'Failed to remove weakness'
  } finally {
    relationLoading.value = false
  }
}

// Add strength
const addStrength = async () => {
  if (!newStrengthId.value || !selectedElement.value) return

  relationLoading.value = true
  relationsError.value = ''

  try {
    await $fetch('/api/admin/strengths', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: {
        elementId: selectedElement.value.id,
        strongAgainstId: newStrengthId.value,
      },
    })

    relationsSuccess.value = 'Strength added successfully'
    newStrengthId.value = ''
    await fetchElements()

    // Update the selected element with fresh data
    const updatedElement = elementsList.value.find(e => e.id === selectedElement.value!.id)
    if (updatedElement) {
      selectedElement.value = updatedElement
      selectedElementStrengths.value = updatedElement.strengthsFrom || []
    }

    setTimeout(() => { relationsSuccess.value = '' }, 3000)
  } catch (error: any) {
    relationsError.value = error.data?.statusMessage || 'Failed to add strength'
  } finally {
    relationLoading.value = false
  }
}

// Delete strength
const deleteStrength = async (strengthId: string) => {
  relationLoading.value = true
  relationsError.value = ''

  try {
    await $fetch(`/api/admin/strengths/${strengthId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    relationsSuccess.value = 'Strength removed successfully'
    await fetchElements()

    // Update the selected element with fresh data
    const updatedElement = elementsList.value.find(e => e.id === selectedElement.value!.id)
    if (updatedElement) {
      selectedElement.value = updatedElement
      selectedElementStrengths.value = updatedElement.strengthsFrom || []
    }

    setTimeout(() => { relationsSuccess.value = '' }, 3000)
  } catch (error: any) {
    relationsError.value = error.data?.statusMessage || 'Failed to remove strength'
  } finally {
    relationLoading.value = false
  }
}

// Open create lithos modal
const openCreateLithosModal = () => {
  lithosForm.value = {
    id: '',
    name: '',
    sprite: '',
    type: '',
    elementId: '',
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
    rarity: lithos.rarity || 'common',
    elementId: lithos.elementId || '',
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
    rarity: 'common',
    elementId: '',
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
    const bodyData: any = {
      name: lithosForm.value.name,
      sprite: lithosForm.value.sprite,
      rarity: lithosForm.value.rarity,
      spikeUp: lithosForm.value.spikeUp,
      spikeRight: lithosForm.value.spikeRight,
      spikeDown: lithosForm.value.spikeDown,
      spikeLeft: lithosForm.value.spikeLeft,
    }

    // Add elementId only if it's not empty
    if (lithosForm.value.elementId) {
      bodyData.elementId = lithosForm.value.elementId
    }

    if (lithosForm.value.id) {
      // Update existing lithos
      await $fetch(`/api/lithos/${lithosForm.value.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: bodyData,
      })
      lithosSuccess.value = 'Lithos updated successfully'
    } else {
      // Create new lithos
      await $fetch('/api/lithos', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: bodyData,
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
const deleteLithos = (lithos: any) => {
  openConfirmModal(
    'Delete Lithos',
    `Are you sure you want to delete ${lithos.name}? This action cannot be undone.`,
    async () => {
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
        throw error
      } finally {
        actionLoading.value = false
      }
    },
    'Delete',
    true
  )
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
  await fetchElements()
  await fetchLithos()
})
</script>

<style scoped src="~/assets/css/admin.css"></style>
