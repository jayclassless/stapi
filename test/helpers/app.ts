import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import supertest from 'supertest'

import { AppModule } from '../../src/app.module'

export interface TestApp {
  app: INestApplication
  gql: (query: string, variables?: object) => supertest.Test
  gqlGet: (query: string) => supertest.Test
}

export async function createApp(): Promise<TestApp> {
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = mod.createNestApplication({ logger: false })
  await app.init()
  const agent = supertest(app.getHttpServer())
  return {
    app,
    gql: (query, variables) => agent.post('/graphql').send({ query, variables }),
    gqlGet: (query) => agent.get('/graphql').query({ query }),
  }
}
