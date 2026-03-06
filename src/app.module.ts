import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import cookieParser from 'cookie-parser'
import type { Request, Response } from 'express'
import type { ServerOptions, SubscribePayload } from 'graphql-ws'
import type { Extra } from 'graphql-ws/dist/use/ws'

import { ActorsModule } from './actors/actors.module'
import { CharactersModule } from './characters/characters.module'
import { DatabaseModule } from './database/database.module'
import { EpisodesModule } from './episodes/episodes.module'
import { FavoritesModule } from './favorites/favorites.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { SeriesModule } from './series/series.module'
import { ShipsModule } from './ships/ships.module'
import { SpeciesModule } from './species/species.module'

const wsLogger = new Logger('WebSocket')

@Module({
  imports: [
    DatabaseModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
      csrfPrevention: false,
      introspection: true,
      allowBatchedHttpRequests: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
      subscriptions: {
        'graphql-ws': {
          path: '/graphql',
          onConnect: (ctx) => {
            const { request } = ctx.extra as Extra
            wsLogger.log(`connect ip=${request.socket.remoteAddress}`)
          },
          onSubscribe: (ctx, id, payload: SubscribePayload) => {
            const { request } = ctx.extra as Extra
            const op = payload.operationName ?? payload.query?.trimStart().split('\n')[0]
            wsLogger.log(`subscribe ip=${request.socket.remoteAddress} id=${id} op=${op}`)
          },
          onComplete: (ctx, id) => {
            const { request } = ctx.extra as Extra
            wsLogger.log(`complete ip=${request.socket.remoteAddress} id=${id}`)
          },
          onClose: (ctx, code) => {
            const { request } = ctx.extra as Extra
            wsLogger.log(`close ip=${request.socket.remoteAddress} code=${code}`)
          },
        } as Partial<ServerOptions<Record<string, unknown>, Extra>>,
      },
    }),
    SeriesModule,
    EpisodesModule,
    CharactersModule,
    ActorsModule,
    SpeciesModule,
    ShipsModule,
    OrganizationsModule,
    FavoritesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*')
  }
}
