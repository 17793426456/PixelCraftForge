import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8080', changeOrigin: true },
      '/health': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // React 三件套
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/@remix-run/router/')
          ) {
            return 'react-vendor'
          }
          // Ant Design Icons
          if (
            id.includes('node_modules/@ant-design/icons') ||
            id.includes('node_modules/@ant-design/icons-svg')
          ) {
            return 'antd-icons'
          }
          // Ant Design 主体（含 rc-* 子组件、@rc-component/*）
          if (
            id.includes('node_modules/antd/') ||
            id.includes('node_modules/rc-') ||
            id.includes('node_modules/@rc-component/') ||
            id.includes('node_modules/@ctrl/tinycolor') ||
            id.includes('node_modules/@ant-design/cssinjs') ||
            id.includes('node_modules/@ant-design/colors')
          ) {
            return 'antd'
          }
          // 其他第三方
          return 'vendor'
        },
      },
    },
  },
})
