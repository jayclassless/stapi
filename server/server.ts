import 'reflect-metadata'
import { createServer } from 'http'

import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express5'
import cookieParser from 'cookie-parser'
import express from 'express'
import type { Request, Response } from 'express'
import { execute, subscribe } from 'graphql'
import { createHandler } from 'graphql-sse/lib/use/express'
import { useServer } from 'graphql-ws/use/ws'
import morgan from 'morgan'
import next from 'next'
import { WebSocketServer } from 'ws'

import { episodesService } from './container.js'
import { getSchema } from './schema.js'

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT ?? '3000', 10)

async function bootstrap() {
  const schema = await getSchema()

  // Initialize Next.js
  // @ts-expect-error next's CJS types don't expose a callable default under NodeNext
  const nextApp = next({ dev })
  const handle = nextApp.getRequestHandler()
  await nextApp.prepare()

  const app = express()
  app.use(morgan('combined'))
  app.use(express.json())
  app.use(cookieParser())

  // SSE handler (before Apollo middleware to prevent prefix matching)
  const sseHandler = createHandler({
    schema,
    execute,
    subscribe,
    context: () => ({ episodesService }),
  })
  app.use('/graphql/sse', sseHandler as unknown as express.RequestHandler)

  // Apollo Server
  const apollo = new ApolloServer({
    schema,
    introspection: true,
    csrfPrevention: false,
    allowBatchedHttpRequests: true,
  })
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

  // Next.js handles all other routes
  app.all('/{*path}', (req: Request, res: Response) => {
    return handle(req, res)
  })

  const httpServer = createServer(app)

  // WebSocket server for GraphQL subscriptions (no automatic upgrade — we route manually)
  const wss = new WebSocketServer({ noServer: true })
  useServer(
    {
      schema,
      context: () => ({ episodesService }),
    },
    wss
  )

  // Route upgrade requests: /graphql → our WSS, everything else → Next.js HMR
  const nextUpgradeHandler = nextApp.getUpgradeHandler()
  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/graphql')) {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
    } else {
      nextUpgradeHandler(req, socket, head)
    }
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
}

bootstrap()
