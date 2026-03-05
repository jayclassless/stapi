import { Module, forwardRef } from '@nestjs/common'

import { CharactersModule } from '../characters/characters.module'
import { OrganizationsResolver } from './organizations.resolver'
import { OrganizationsService } from './organizations.service'

@Module({
  imports: [forwardRef(() => CharactersModule)],
  providers: [OrganizationsResolver, OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
