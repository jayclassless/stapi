import { Module, forwardRef } from '@nestjs/common';
import { ActorsResolver } from './actors.resolver';
import { ActorsService } from './actors.service';
import { CharactersModule } from '../characters/characters.module';

@Module({
  imports: [forwardRef(() => CharactersModule)],
  providers: [ActorsResolver, ActorsService],
  exports: [ActorsService],
})
export class ActorsModule {}
