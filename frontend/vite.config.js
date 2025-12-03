import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3333,
    proxy: {
      '/api': {
        target: 'http://localhost:8333',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8333',
        ws: true,
      },
    },
  },
})

