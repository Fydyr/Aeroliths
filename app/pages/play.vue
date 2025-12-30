<template>
  <PlayComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Play - Aeroliths',
  meta: [
    { name: 'description', content: 'Play Aeroliths game' }
  ]
})
</script>
