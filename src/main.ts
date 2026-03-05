import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { GraphQLSchemaHost } from '@nestjs/graphql'
import { execute, subscribe } from 'graphql'
import { createHandler } from 'graphql-sse/lib/use/express'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()

  // Register the SSE handler before app.init() so it is inserted into the
  // Express middleware chain ahead of Apollo's app.use('/graphql', ...) handler
  // (which would otherwise intercept /graphql/sse via prefix matching).
  // The schema is resolved lazily on the first request, after init has run.
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

  await app.listen(3000)
  console.log('GraphQL API running at http://localhost:3000/graphql')
}
bootstrap()
