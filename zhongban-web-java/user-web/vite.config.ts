import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 13089,
    strictPort: true, // 强制使用指定端口，如果被占用则报错
    proxy: {
      '/api': {
        target: 'http://localhost:11031',
        changeOrigin: true,
        rewrite: (path) => path // 不重写路径，因为后端已经有/api前缀
      }
    }
  }
})