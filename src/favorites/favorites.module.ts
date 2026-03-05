import { Module } from '@nestjs/common'

import { EpisodesModule } from '../episodes/episodes.module'
import { FavoritesResolver } from './favorites.resolver'

@Module({
  imports: [EpisodesModule],
  providers: [FavoritesResolver],
})
export class FavoritesModule {}
