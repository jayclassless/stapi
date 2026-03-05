import { Module, forwardRef } from '@nestjs/common'

import { CharactersModule } from '../characters/characters.module'
import { SpeciesResolver } from './species.resolver'
import { SpeciesService } from './species.service'

@Module({
  imports: [forwardRef(() => CharactersModule)],
  providers: [SpeciesResolver, SpeciesService],
  exports: [SpeciesService],
})
export class SpeciesModule {}
