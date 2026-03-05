import { Inject, forwardRef } from '@nestjs/common'
import { Resolver, Query, Args, Int, ResolveField, Parent } from '@nestjs/graphql'

import { CharacterConnection } from '../characters/character.model'
import { CharactersService } from '../characters/characters.service'
import { Species, SpeciesConnection } from './species.model'
import { SpeciesService } from './species.service'

@Resolver(() => Species)
export class SpeciesResolver {
  constructor(
    private readonly speciesService: SpeciesService,
    /* v8 ignore start */
    @Inject(forwardRef(() => CharactersService))
    /* v8 ignore stop */
    private readonly charactersService: CharactersService
  ) {}

  @Query(() => SpeciesConnection, { name: 'species' })
  findAll(
    @Args('warpCapable', { nullable: true }) warpCapable?: boolean,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.speciesService.findAll({ warpCapable }, { first, last, before, after })
  }

  @Query(() => Species, { name: 'speciesById', nullable: true })
  findById(@Args('id', { type: () => Int }) id: number) {
    return this.speciesService.findById(id)
  }

  @ResolveField(() => CharacterConnection)
  characters(
    @Parent() species: Species,
    @Args('gender', { nullable: true }) gender?: string,
    @Args('primaryActor', { nullable: true, type: () => Int }) primaryActor?: number,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.charactersService.findBySpeciesId(
      species.species_id,
      { gender, primaryActor },
      { first, last, before, after }
    )
  }
}
