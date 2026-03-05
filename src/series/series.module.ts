import { Module, forwardRef } from '@nestjs/common';
import { SeriesResolver } from './series.resolver';
import { SeriesService } from './series.service';
import { EpisodesModule } from '../episodes/episodes.module';

@Module({
  imports: [forwardRef(() => EpisodesModule)],
  providers: [SeriesResolver, SeriesService],
  exports: [SeriesService],
})
export class SeriesModule {}
