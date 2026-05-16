import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    proxy: {
      '/api': {
        target: 'http://3.25.222.207:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://3.25.222.207:3001',
        changeOrigin: true,
        ws: true,
      },
    }
  }
})
