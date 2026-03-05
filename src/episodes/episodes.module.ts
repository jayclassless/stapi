import { Module, forwardRef } from '@nestjs/common'

import { CharactersModule } from '../characters/characters.module'
import { SeriesModule } from '../series/series.module'
import { EpisodesResolver } from './episodes.resolver'
import { EpisodesService } from './episodes.service'

@Module({
  imports: [forwardRef(() => SeriesModule), forwardRef(() => CharactersModule)],
  providers: [EpisodesResolver, EpisodesService],
  exports: [EpisodesService],
})
export class EpisodesModule {}
