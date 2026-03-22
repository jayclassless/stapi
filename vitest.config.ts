import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: false },
      },
    }),
  ],
  test: {
    include: ['server/**/*.spec.ts'],
    setupFiles: ['reflect-metadata'],
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts'],
      exclude: [
        'server/server.ts',
        'server/container.ts',
        'server/schema.ts',
        'server/**/*.model.ts',
        'server/**/*.spec.ts',
        'server/common/page-info.type.ts',
        'server/common/pagination.input.ts',
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
    },
  },
})
