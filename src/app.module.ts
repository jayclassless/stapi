import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DatabaseModule } from './database/database.module';
import { SeriesModule } from './series/series.module';
import { EpisodesModule } from './episodes/episodes.module';
import { CharactersModule } from './characters/characters.module';
import { ActorsModule } from './actors/actors.module';
import { SpeciesModule } from './species/species.module';
import { ShipsModule } from './ships/ships.module';
import { OrganizationsModule } from './organizations/organizations.module';

@Module({
  imports: [
    DatabaseModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
      csrfPrevention: false,
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
