import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import cookieParser from 'cookie-parser'

import { ActorsModule } from './actors/actors.module'
import { CharactersModule } from './characters/characters.module'
import { DatabaseModule } from './database/database.module'
import { EpisodesModule } from './episodes/episodes.module'
import { FavoritesModule } from './favorites/favorites.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { SeriesModule } from './series/series.module'
import { ShipsModule } from './ships/ships.module'
import { SpeciesModule } from './species/species.module'

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
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
      subscriptions: {
        'graphql-ws': { path: '/graphql' },
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
