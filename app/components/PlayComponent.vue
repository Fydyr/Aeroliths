<template>
  <div class="play-page">
    <div class="play-container">
      <h1>Play Aeroliths</h1>
      <p>Welcome {{ user?.username }}! The game interface will be here.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()
</script>

<style scoped src="~/assets/css/play.css"></style>
