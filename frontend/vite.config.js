import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'

const backendOrigin = process.env.VITE_DEV_BACKEND_ORIGIN || 'http://localhost:8000'
const commitSha =
  process.env.VITE_COMMIT_SHA ||
  (() => {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
    } catch {
      return 'unknown'
    }
  })()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_COMMIT_SHA__: JSON.stringify(commitSha),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
        },
      },
    },
  },
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
