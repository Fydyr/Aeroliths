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
        <NuxtLink href="/play" @click="mobileMenuOpen = false">Play</NuxtLink>
        <NuxtLink href="/rules" @click="mobileMenuOpen = false">Rules</NuxtLink>
        <NuxtLink href="/leaderboard" @click="mobileMenuOpen = false">Leaderboard</NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const mobileMenuOpen = ref(false)
</script>

<style scoped src="~/assets/css/header.css"></style>
