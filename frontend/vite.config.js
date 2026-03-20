import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backendOrigin = process.env.VITE_DEV_BACKEND_ORIGIN || 'http://localhost:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: backendOrigin,
        changeOrigin: true,
      },
      '/media': {
        target: backendOrigin,
        changeOrigin: true,
      },
      '/ws': {
        target: backendOrigin.replace('http://', 'ws://').replace('https://', 'wss://'),
        ws: true,
      },
    },
  }
})
