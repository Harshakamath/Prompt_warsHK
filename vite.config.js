import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Vite 8 uses oxc-based minification by default (rolldown)
    // Warn if any chunk exceeds 500 kB
    chunkSizeWarningLimit: 500
  }
})
