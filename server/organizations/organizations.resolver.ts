import { Resolver, Query, Arg, Int, FieldResolver, Root } from 'type-graphql'

import { CharacterConnection } from '../characters/character.model.js'
import { CharactersService } from '../characters/characters.service.js'
import { Organization, OrganizationConnection } from './organization.model.js'
import { OrganizationsService } from './organizations.service.js'

@Resolver(() => Organization)
export class OrganizationsResolver {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly charactersService: CharactersService
  ) {}

  @Query(() => OrganizationConnection, { name: 'organizations' })
  findAll(
    @Arg('type', () => String, { nullable: true }) type?: string,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.organizationsService.findAll({ type }, { first, last, before, after })
  }

  @Query(() => Organization, { name: 'organization', nullable: true })
  findById(@Arg('id', () => Int) id: number) {
    return this.organizationsService.findById(id)
  }

  @FieldResolver(() => CharacterConnection)
  characters(
    @Root() organization: Organization,
    @Arg('gender', () => String, { nullable: true }) gender?: string,
    @Arg('primaryActor', () => Int, { nullable: true }) primaryActor?: number,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.charactersService.findByOrganizationId(
      organization.organization_id,
      { gender, primaryActor },
      { first, last, before, after }
    )
  }
}
