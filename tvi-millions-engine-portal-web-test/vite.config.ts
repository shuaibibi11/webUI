import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
// import { resolve } from 'path'
// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const host = loadEnv(mode, process.cwd()).VITE_HOST
  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
        // '@': resolve(__dirname, './src')
      },
    },
    server: {
        port: 9527,
        proxy: {
          '/api': {
            target: host,
            changeOrigin: true,
            // ws: true,
            secure: false,
          },
          
        }
       
    },
  }
})

