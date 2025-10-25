import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      '.manusvm.computer',
      'localhost',
    ],
    hmr: {
      clientPort: 443,
      protocol: 'wss',
    },
  },
})
