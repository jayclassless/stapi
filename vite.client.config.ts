import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: { outDir: '../public', emptyOutDir: true },
  server: {
    proxy: {
      '/graphql': { target: 'http://localhost:3000', ws: true },
    },
  },
})
