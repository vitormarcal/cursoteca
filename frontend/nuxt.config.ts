// https://nuxt.com/docs/api/configuration/nuxt-config
const backendUrl = process.env.NUXT_BACKEND_URL || 'http://localhost:8080'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  nitro: {
    devProxy: {
      '/api': {
        target: `${backendUrl}/api`,
        changeOrigin: true
      },
      '/assets': {
        target: `${backendUrl}/assets`,
        changeOrigin: true
      }
    }
  }
})
