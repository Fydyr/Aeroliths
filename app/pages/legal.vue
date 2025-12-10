<template>
  <div class="legal-page">
    <LegalContentComponent />
  </div>
</template>

<script setup lang="ts">
import type LegalContentComponent from '~/components/LegalContentComponent.vue';

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Legal Notice - Aeroliths',
  meta: [
    { name: 'description', content: 'Legal notice and terms of use for Aeroliths game' }
  ]
})
</script>
