import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
    css: true,
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/graphql': 'http://127.0.0.1:4000',
      '/health': 'http://127.0.0.1:4000',
      '/ready': 'http://127.0.0.1:4000',
    },
  },
})
