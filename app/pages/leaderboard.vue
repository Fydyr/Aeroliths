<template>
  <LeaderboardComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Leaderboard - Aeroliths',
  meta: [
    { name: 'description', content: 'View the top players on Aeroliths' }
  ]
})
</script>
