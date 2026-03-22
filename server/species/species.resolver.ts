import { Resolver, Query, Arg, Int, FieldResolver, Root } from 'type-graphql'

import { CharacterConnection } from '../characters/character.model.js'
import { CharactersService } from '../characters/characters.service.js'
import { Species, SpeciesConnection } from './species.model.js'
import { SpeciesService } from './species.service.js'

@Resolver(() => Species)
export class SpeciesResolver {
  constructor(
    private readonly speciesService: SpeciesService,
    private readonly charactersService: CharactersService
  ) {}

  @Query(() => SpeciesConnection, { name: 'species' })
  findAll(
    @Arg('warpCapable', () => Boolean, { nullable: true }) warpCapable?: boolean,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.speciesService.findAll({ warpCapable }, { first, last, before, after })
  }

  @Query(() => Species, { name: 'speciesById', nullable: true })
  findById(@Arg('id', () => Int) id: number) {
    return this.speciesService.findById(id)
  }

  @FieldResolver(() => CharacterConnection)
  characters(
    @Root() species: Species,
    @Arg('gender', () => String, { nullable: true }) gender?: string,
    @Arg('primaryActor', () => Int, { nullable: true }) primaryActor?: number,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.charactersService.findBySpeciesId(
      species.species_id,
      { gender, primaryActor },
      { first, last, before, after }
    )
  }
}
