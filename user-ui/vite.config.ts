import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 11004,
    proxy: {
      '/api': {
        target: process.env.VITE_USER_API_ORIGIN || 'http://localhost:3003',
        changeOrigin: true
      }
    }
  }
})
