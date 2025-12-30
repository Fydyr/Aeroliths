<template>
  <RulesComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Rules - Aeroliths',
  meta: [
    { name: 'description', content: 'Learn how to play Aeroliths' }
  ]
})
</script>
