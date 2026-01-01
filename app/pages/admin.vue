<template>
  <AdminComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'Admin Panel - Aeroliths',
  meta: [{ name: 'description', content: 'Admin panel for managing users and lithos' }],
})
</script>
