import { Inject, forwardRef } from '@nestjs/common'
import { Resolver, Query, Args, Int, ResolveField, Parent } from '@nestjs/graphql'

import { CharacterConnection } from '../characters/character.model'
import { CharactersService } from '../characters/characters.service'
import { Organization, OrganizationConnection } from './organization.model'
import { OrganizationsService } from './organizations.service'

@Resolver(() => Organization)
export class OrganizationsResolver {
  constructor(
    private readonly organizationsService: OrganizationsService,
    /* v8 ignore start */
    @Inject(forwardRef(() => CharactersService))
    /* v8 ignore stop */
    private readonly charactersService: CharactersService
  ) {}

  @Query(() => OrganizationConnection, { name: 'organizations' })
  findAll(
    @Args('type', { nullable: true }) type?: string,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.organizationsService.findAll({ type }, { first, last, before, after })
  }

  @Query(() => Organization, { name: 'organization', nullable: true })
  findById(@Args('id', { type: () => Int }) id: number) {
    return this.organizationsService.findById(id)
  }

  @ResolveField(() => CharacterConnection)
  characters(
    @Parent() organization: Organization,
    @Args('gender', { nullable: true }) gender?: string,
    @Args('primaryActor', { nullable: true, type: () => Int }) primaryActor?: number,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.charactersService.findByOrganizationId(
      organization.organization_id,
      { gender, primaryActor },
      { first, last, before, after }
    )
  }
}
