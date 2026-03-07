import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['client/src/**/*.test.{ts,tsx}'],
    setupFiles: ['client/src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['client/src/**/*.{ts,tsx}'],
      exclude: ['**/main.tsx', '**/types.ts', '**/apollo.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
    },
  },
})
