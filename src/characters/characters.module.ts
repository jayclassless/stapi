import { Module, forwardRef } from '@nestjs/common'

import { ActorsModule } from '../actors/actors.module'
import { EpisodesModule } from '../episodes/episodes.module'
import { OrganizationsModule } from '../organizations/organizations.module'
import { SpeciesModule } from '../species/species.module'
import { CharactersResolver } from './characters.resolver'
import { CharactersService } from './characters.service'

@Module({
  imports: [
    forwardRef(() => SpeciesModule),
    forwardRef(() => ActorsModule),
    forwardRef(() => OrganizationsModule),
    forwardRef(() => EpisodesModule),
  ],
  providers: [CharactersResolver, CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
