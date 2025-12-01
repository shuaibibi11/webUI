import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 11011,
    proxy: {
      '/api': {
        target: process.env.VITE_ADMIN_API_ORIGIN || 'http://localhost:11025',
        changeOrigin: true
      },
      '/users/login': {
        target: process.env.VITE_USER_API_ORIGIN || 'http://localhost:11020',
        changeOrigin: true
      }
    }
  }
})
