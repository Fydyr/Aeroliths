// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@vueuse/nuxt'],
  css: ['~/assets/css/global.css'],
  app: {
    // This is the key setting for internal link behavior
    baseURL: '/aeroliths/',
    // Optional: ensures build assets are also found here
    buildAssetsDir: '/_nuxt/'
  },
  vite: {
    server: {
      allowedHosts: ['kinator.fr']
    }
  },
  // Exclude test files from Nuxt
  ignore: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/tests/**',
    '**/vitest.config.ts'
  ]
})
