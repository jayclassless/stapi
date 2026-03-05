import { INestApplication } from '@nestjs/common'
import { GraphQLSchemaHost } from '@nestjs/graphql'
import { Test } from '@nestjs/testing'
import { execute, subscribe } from 'graphql'
import { createHandler } from 'graphql-sse/lib/use/express'
import { createClient as createWsClient } from 'graphql-ws'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import WebSocket from 'ws'

import { AppModule } from '../src/app.module'

const QUERY = 'subscription { randomEpisode(count: 1) { id title } }'

let app: INestApplication
let port: number

beforeAll(async () => {
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = mod.createNestApplication({ logger: false })

  // Register the SSE handler before init so it comes before Apollo's
  // app.use('/graphql', ...) in the Express middleware chain.
  let sseHandler: ((req: any, res: any) => Promise<void>) | null = null
  app
    .getHttpAdapter()
    .getInstance()
    .use('/graphql/sse', async (req: any, res: any) => {
      if (!sseHandler) {
        const { schema } = app.get(GraphQLSchemaHost)
        sseHandler = createHandler({ schema, execute, subscribe })
      }
      await sseHandler(req, res)
    })

  await app.listen(0)
  port = (app.getHttpServer().address() as { port: number }).port
}, 30000)

afterAll(async () => {
  await app.close()
})

describe('WebSocket subscription', () => {
  it('receives a random Episode via graphql-ws', async () => {
    const client = createWsClient({
      url: `ws://localhost:${port}/graphql`,
      webSocketImpl: WebSocket,
    })

    const result = await new Promise<any>((resolve, reject) => {
      client.subscribe({ query: QUERY }, { next: resolve, error: reject, complete() {} })
    })

    await client.dispose()
    expect(result.data.randomEpisode.title).toBeTruthy()
  }, 10000)
})

describe('SSE subscription', () => {
  // The graphql-sse library uses the ESM build in vitest, which creates a
  // separate realm for GraphQLSchema. Using raw fetch + SSE event parsing
  // tests the SSE transport at the protocol level without cross-realm issues.
  it('receives a random Episode via SSE', async () => {
    const resp = await fetch(`http://localhost:${port}/graphql/sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ query: QUERY }),
    })

    expect(resp.ok).toBe(true)
    expect(resp.headers.get('content-type')).toContain('text/event-stream')

    const text = await resp.text()
    // SSE payload: "event: next\ndata: <json>\n\nevent: complete\ndata:\n\n"
    const match = text.match(/event: next\ndata: (.+)/)
    expect(match).not.toBeNull()
    const data = JSON.parse(match![1])
    expect(data.data.randomEpisode.title).toBeTruthy()
  }, 10000)
})
