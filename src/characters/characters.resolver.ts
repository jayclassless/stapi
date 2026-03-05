import { Inject, forwardRef } from '@nestjs/common'
import { Resolver, Query, Args, Int, ResolveField, Parent } from '@nestjs/graphql'

import { Actor, ActorConnection } from '../actors/actor.model'
import { ActorsService } from '../actors/actors.service'
import { EpisodeConnection } from '../episodes/episode.model'
import { EpisodesService } from '../episodes/episodes.service'
import { OrganizationConnection } from '../organizations/organization.model'
import { OrganizationsService } from '../organizations/organizations.service'
import { Species } from '../species/species.model'
import { SpeciesService } from '../species/species.service'
import { Character, CharacterConnection } from './character.model'
import { CharactersService } from './characters.service'

@Resolver(() => Character)
export class CharactersResolver {
  constructor(
    private readonly charactersService: CharactersService,
    private readonly speciesService: SpeciesService,
    private readonly actorsService: ActorsService,
    private readonly organizationsService: OrganizationsService,
    /* v8 ignore start */
    @Inject(forwardRef(() => EpisodesService))
    /* v8 ignore stop */
    private readonly episodesService: EpisodesService
  ) {}

  @Query(() => CharacterConnection, { name: 'characters' })
  findAll(
    @Args('gender', { nullable: true }) gender?: string,
    @Args('primaryActor', { nullable: true, type: () => Int }) primaryActor?: number,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.charactersService.findAll({ gender, primaryActor }, { first, last, before, after })
  }

  @Query(() => Character, { name: 'character', nullable: true })
  findById(@Args('id', { type: () => Int }) id: number) {
    return this.charactersService.findById(id)
  }

  @ResolveField(() => Species, { nullable: true })
  species(@Parent() character: Character) {
    if (!character.species_id) return null
    return this.speciesService.findById(character.species_id)
  }

  @ResolveField(() => Actor, { nullable: true, name: 'primaryActor' })
  primaryActor(@Parent() character: Character) {
    if (!character.primary_actor_id) return null
    return this.actorsService.findById(character.primary_actor_id)
  }

  @ResolveField(() => ActorConnection)
  actors(
    @Parent() character: Character,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.actorsService.findByCharacterId(character.character_id, {
      first,
      last,
      before,
      after,
    })
  }

  @ResolveField(() => OrganizationConnection)
  organizations(
    @Parent() character: Character,
    @Args('type', { nullable: true }) type?: string,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.organizationsService.findByCharacterId(
      character.character_id,
      { type },
      { first, last, before, after }
    )
  }

  @ResolveField(() => EpisodeConnection)
  episodes(
    @Parent() character: Character,
    @Args('series', { nullable: true, type: () => Int }) series?: number,
    @Args('season', { nullable: true, type: () => Int }) season?: number,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.episodesService.findByCharacterId(
      character.character_id,
      { series, season },
      { first, last, before, after }
    )
  }
}
