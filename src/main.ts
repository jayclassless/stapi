import 'reflect-metadata'
import path from 'path'

import { NestFactory } from '@nestjs/core'
import { GraphQLSchemaHost } from '@nestjs/graphql'
import type { Request, Response } from 'express'
import express from 'express'
import { execute, subscribe } from 'graphql'
import { createHandler } from 'graphql-sse/lib/use/express'
import morgan from 'morgan'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  app.use(morgan('combined'))

  // Serve the React client app (built to public/) at the root path.
  // __dirname at runtime is dist/; ../public resolves to the project root public/.
  app
    .getHttpAdapter()
    .getInstance()
    .use(express.static(path.join(__dirname, '..', 'public')))

  // Register the SSE handler before app.init() so it is inserted into the
  // Express middleware chain ahead of Apollo's app.use('/graphql', ...) handler
  // (which would otherwise intercept /graphql/sse via prefix matching).
  // The schema is resolved lazily on the first request, after init has run.
  let sseHandler: ReturnType<typeof createHandler> | null = null
  app
    .getHttpAdapter()
    .getInstance()
    .use('/graphql/sse', async (req: Request, res: Response) => {
      if (!sseHandler) {
        const { schema } = app.get(GraphQLSchemaHost)
        sseHandler = createHandler({ schema, execute, subscribe })
      }
      await sseHandler(req, res)
    })

  const port = process.env.PORT ?? 3000
  await app.listen(port)
}
bootstrap()
