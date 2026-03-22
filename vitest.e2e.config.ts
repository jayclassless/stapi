import path from 'path'

import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Force all graphql imports to use the same CJS instance so that
  // graphql-sse (which prefers .mjs) and our server (which uses require()) share
  // a single GraphQLSchema class and cross-realm instanceof checks pass.
  resolve: {
    alias: { graphql: path.resolve('./node_modules/graphql/index.js') },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: false },
      },
    }),
  ],
  test: {
    include: ['test/**/*.e2e.spec.ts'],
    setupFiles: ['reflect-metadata'],
    globals: true,
  },
})
