import 'reflect-metadata'
import { createServer, type Server } from 'http'

import express from 'express'
import { execute, subscribe } from 'graphql'
import { createHandler } from 'graphql-sse/lib/use/express'
import { createClient as createWsClient } from 'graphql-ws'
import { useServer } from 'graphql-ws/use/ws'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import WebSocket from 'ws'
import { WebSocketServer } from 'ws'

import { episodesService } from '../server/container'
import { getSchema } from '../server/schema'

const QUERY = 'subscription { randomEpisode(count: 1) { id title } }'

let httpServer: Server
let port: number

beforeAll(async () => {
  const schema = await getSchema()
  const app = express()

  // SSE handler — pass episodesService via context for subscription's subscribe function
  const sseHandler = createHandler({
    schema,
    execute,
    subscribe,
    context: () => ({ episodesService }),
  })
  app.use('/graphql/sse', sseHandler as unknown as express.RequestHandler)

  httpServer = createServer(app)

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/graphql' })
  useServer({ schema, context: () => ({ episodesService }) }, wss)

  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  port = (httpServer.address() as { port: number }).port
}, 30000)

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    httpServer.close((err) => (err ? reject(err) : resolve()))
  )
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
  it('receives a random Episode via SSE', async () => {
    const resp = await fetch(`http://localhost:${port}/graphql/sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ query: QUERY }),
    })

    expect(resp.ok).toBe(true)
    expect(resp.headers.get('content-type')).toContain('text/event-stream')

    const text = await resp.text()
    const match = text.match(/event: next\ndata: (.+)/)
    expect(match).not.toBeNull()
    const data = JSON.parse(match![1])
    expect(data.data.randomEpisode.title).toBeTruthy()
  }, 10000)
})
