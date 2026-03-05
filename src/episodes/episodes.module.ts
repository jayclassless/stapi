import { Module, forwardRef } from '@nestjs/common';
import { EpisodesResolver } from './episodes.resolver';
import { EpisodesService } from './episodes.service';
import { SeriesModule } from '../series/series.module';
import { CharactersModule } from '../characters/characters.module';

@Module({
  imports: [
    forwardRef(() => SeriesModule),
    forwardRef(() => CharactersModule),
  ],
  providers: [EpisodesResolver, EpisodesService],
  exports: [EpisodesService],
})
export class EpisodesModule {}
