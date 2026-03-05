import { Module, forwardRef } from '@nestjs/common'

import { EpisodesModule } from '../episodes/episodes.module'
import { FavoritesResolver } from './favorites.resolver'

@Module({
  imports: [forwardRef(() => EpisodesModule)],
  providers: [FavoritesResolver],
})
export class FavoritesModule {}
