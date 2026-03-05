import { Module, forwardRef } from '@nestjs/common'

import { EpisodesModule } from '../episodes/episodes.module'
import { SeriesResolver } from './series.resolver'
import { SeriesService } from './series.service'

@Module({
  imports: [forwardRef(() => EpisodesModule)],
  providers: [SeriesResolver, SeriesService],
  exports: [SeriesService],
})
export class SeriesModule {}
