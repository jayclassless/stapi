import { Module, forwardRef } from '@nestjs/common';
import { CharactersResolver } from './characters.resolver';
import { CharactersService } from './characters.service';
import { SpeciesModule } from '../species/species.module';
import { ActorsModule } from '../actors/actors.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { EpisodesModule } from '../episodes/episodes.module';

@Module({
  imports: [
    SpeciesModule,
    ActorsModule,
    OrganizationsModule,
    forwardRef(() => EpisodesModule),
  ],
  providers: [CharactersResolver, CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
