import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  server: {
    port: 13085,
    host: '0.0.0.0',
    strictPort: true, // 强制使用指定端口，如果被占用则报错
    proxy: {
      // admin-api 路由 - 统一代理配置
      '/api/admin': {
        target: 'http://localhost:11025',
        changeOrigin: true
      },
      // 直接代理admin路径到admin-api
      '/admin': {
        target: 'http://localhost:11025',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin/, '/admin')
      },
      // user-api 路由
      '/api/users': {
        target: 'http://localhost:11031',
        changeOrigin: true
      },
      // 其他路由
      '/api/conversations': {
        target: 'http://localhost:11031',
        changeOrigin: true
      },
      '/api/messages': {
        target: 'http://localhost:11031',
        changeOrigin: true
      },
      '/api/chat': {
        target: 'http://localhost:11031',
        changeOrigin: true
      }
    }
  }
})