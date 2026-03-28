import 'reflect-metadata'
import { createHash } from 'crypto'

import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express5'
import cookieParser from 'cookie-parser'
import express from 'express'
import type { Request, Response } from 'express'
import supertest from 'supertest'

import { episodesService } from '../../server/container'
import { getSchema } from '../../server/schema'

function sha256(query: string): string {
  return createHash('sha256').update(query).digest('hex')
}

export interface TestApp {
  cleanup: () => Promise<void>
  gql: (query: string, variables?: object) => supertest.Test
  gqlGet: (query: string) => supertest.Test
  gqlBatch: (operations: Array<{ query: string; variables?: object }>) => supertest.Test
  gqlApqHashOnly: (query: string, variables?: object) => supertest.Test
  gqlApqRegister: (query: string, variables?: object) => supertest.Test
  gqlApqGetHashOnly: (query: string) => supertest.Test
}

export async function createApp(): Promise<TestApp> {
  const schema = await getSchema()
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  const apollo = new ApolloServer({ schema, csrfPrevention: false, allowBatchedHttpRequests: true })
  await apollo.start()
  app.use(
    '/graphql',
    expressMiddleware(apollo, {
      context: async ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
        episodesService,
      }),
    })
  )
  const agent = supertest(app)
  return {
    cleanup: () => apollo.stop(),
    gql: (query, variables) => agent.post('/graphql').send({ query, variables }),
    gqlGet: (query) => agent.get('/graphql').query({ query }),
    gqlBatch: (operations) => agent.post('/graphql').send(operations),
    gqlApqHashOnly: (query, variables) => {
      const hash = sha256(query)
      return agent.post('/graphql').send({
        variables,
        extensions: { persistedQuery: { version: 1, sha256Hash: hash } },
      })
    },
    gqlApqRegister: (query, variables) => {
      const hash = sha256(query)
      return agent.post('/graphql').send({
        query,
        variables,
        extensions: { persistedQuery: { version: 1, sha256Hash: hash } },
      })
    },
    gqlApqGetHashOnly: (query) => {
      const hash = sha256(query)
      return agent.get('/graphql').query({
        extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: hash } }),
      })
    },
  }
}
