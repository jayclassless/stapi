import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'

import { ActorsModule } from './actors/actors.module'
import { CharactersModule } from './characters/characters.module'
import { DatabaseModule } from './database/database.module'
import { EpisodesModule } from './episodes/episodes.module'
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
  ],
})
export class AppModule {}
