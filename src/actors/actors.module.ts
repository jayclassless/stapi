import { Module, forwardRef } from '@nestjs/common'

import { CharactersModule } from '../characters/characters.module'
import { ActorsResolver } from './actors.resolver'
import { ActorsService } from './actors.service'

@Module({
  imports: [forwardRef(() => CharactersModule)],
  providers: [ActorsResolver, ActorsService],
  exports: [ActorsService],
})
export class ActorsModule {}
