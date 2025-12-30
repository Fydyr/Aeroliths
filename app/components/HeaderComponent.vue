<template>
  <header class="header">
    <div class="header-container">
      <div class="logo">
        <NuxtLink href="/">
          <h1>Aeroliths</h1>
        </NuxtLink>
      </div>

      <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle menu">
        <span v-if="!mobileMenuOpen">☰</span>
        <span v-else>✕</span>
      </button>

      <nav class="nav" :class="{ 'nav-open': mobileMenuOpen }">
        <NuxtLink href="/" @click="mobileMenuOpen = false">Home</NuxtLink>

        <!-- Protected links - only visible when authenticated -->
        <template v-if="isAuthenticated">
          <NuxtLink href="/play" @click="mobileMenuOpen = false">Play</NuxtLink>
          <NuxtLink href="/rules" @click="mobileMenuOpen = false">Rules</NuxtLink>
          <NuxtLink href="/leaderboard" @click="mobileMenuOpen = false">Leaderboard</NuxtLink>

          <!-- User menu -->
          <div class="user-menu">
            <span class="username">{{ user?.username }}</span>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </div>
        </template>

        <!-- Auth links - only visible when not authenticated -->
        <template v-else>
          <NuxtLink href="/login" @click="mobileMenuOpen = false">Login</NuxtLink>
          <NuxtLink href="/register" @click="mobileMenuOpen = false">Register</NuxtLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

const mobileMenuOpen = ref(false)
const { isAuthenticated, user, logout, initAuth } = useAuth()

// Initialize auth state on component mount
onMounted(async () => {
  await initAuth()
})

const handleLogout = () => {
  mobileMenuOpen.value = false
  logout()
}
</script>

<style scoped src="~/assets/css/header.css"></style>
