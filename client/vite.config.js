import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api':     { target: 'https://nexora-production-5cac.up.railway.app', changeOrigin: true },
      '/gateway': { target: 'https://nexora-production-5cac.up.railway.app', changeOrigin: true },
    },
  },
})