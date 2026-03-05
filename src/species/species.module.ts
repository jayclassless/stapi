import { Module, forwardRef } from '@nestjs/common';
import { SpeciesResolver } from './species.resolver';
import { SpeciesService } from './species.service';
import { CharactersModule } from '../characters/characters.module';

@Module({
  imports: [forwardRef(() => CharactersModule)],
  providers: [SpeciesResolver, SpeciesService],
  exports: [SpeciesService],
})
export class SpeciesModule {}
