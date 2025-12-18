<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <p>{{ SITE_INFO.copyright }}</p>
        <div class="footer-links">
          <NuxtLink href="/legal">Legal</NuxtLink>
          <a :href="SITE_INFO.discord.url" target="_blank" rel="noopener noreferrer" class="discord-link">
            <UIcon name="i-simple-icons-discord" class="discord-icon" />
            Discord
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { SITE_INFO } from '~/constants/site'
</script>

<style scoped src="~/assets/css/footer.css"></style>
