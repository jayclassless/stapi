import 'reflect-metadata'
import { buildSchema } from 'type-graphql'

import { initContainer, resolverClasses, resolverMap } from './container.js'

export async function createSchema() {
  initContainer()
  return buildSchema({
    resolvers: resolverClasses as unknown as [Function, ...Function[]],
    container: { get: (cls) => resolverMap.get(cls) },
    // type-graphql requires pubSub even when all subscriptions use custom subscribe functions.
    // This is a no-op stub — all subscriptions use custom `subscribe` functions in their decorators.
    pubSub: {
      publish() {},
      subscribe() {
        return {
          [Symbol.asyncIterator]: () => ({
            next: () => Promise.resolve({ done: true, value: undefined }),
          }),
        }
      },
    },
  })
}

// Cache the built schema as a singleton
let schemaPromise: ReturnType<typeof createSchema> | null = null

export function getSchema() {
  if (!schemaPromise) {
    schemaPromise = createSchema()
  }
  return schemaPromise
}
