import { Resolver, Query, Arg, Int, FieldResolver, Root } from 'type-graphql'

import { Actor, ActorConnection } from '../actors/actor.model.js'
import { ActorsService } from '../actors/actors.service.js'
import { EpisodeConnection } from '../episodes/episode.model.js'
import { EpisodesService } from '../episodes/episodes.service.js'
import { OrganizationConnection } from '../organizations/organization.model.js'
import { OrganizationsService } from '../organizations/organizations.service.js'
import { Species } from '../species/species.model.js'
import { SpeciesService } from '../species/species.service.js'
import { Character, CharacterConnection } from './character.model.js'
import { CharactersService } from './characters.service.js'

@Resolver(() => Character)
export class CharactersResolver {
  constructor(
    private readonly charactersService: CharactersService,
    private readonly speciesService: SpeciesService,
    private readonly actorsService: ActorsService,
    private readonly organizationsService: OrganizationsService,
    private readonly episodesService: EpisodesService
  ) {}

  @Query(() => CharacterConnection, { name: 'characters' })
  findAll(
    @Arg('gender', () => String, { nullable: true }) gender?: string,
    @Arg('primaryActor', () => Int, { nullable: true }) primaryActor?: number,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.charactersService.findAll({ gender, primaryActor }, { first, last, before, after })
  }

  @Query(() => Character, { name: 'character', nullable: true })
  findById(@Arg('id', () => Int) id: number) {
    return this.charactersService.findById(id)
  }

  @FieldResolver(() => Species, { nullable: true })
  species(@Root() character: Character) {
    if (!character.species_id) return null
    return this.speciesService.findById(character.species_id)
  }

  @FieldResolver(() => Actor, { nullable: true, name: 'primaryActor' })
  primaryActor(@Root() character: Character) {
    if (!character.primary_actor_id) return null
    return this.actorsService.findById(character.primary_actor_id)
  }

  @FieldResolver(() => ActorConnection)
  actors(
    @Root() character: Character,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.actorsService.findByCharacterId(character.character_id, {
      first,
      last,
      before,
      after,
    })
  }

  @FieldResolver(() => OrganizationConnection)
  organizations(
    @Root() character: Character,
    @Arg('type', () => String, { nullable: true }) type?: string,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.organizationsService.findByCharacterId(
      character.character_id,
      { type },
      { first, last, before, after }
    )
  }

  @FieldResolver(() => EpisodeConnection)
  episodes(
    @Root() character: Character,
    @Arg('series', () => Int, { nullable: true }) series?: number,
    @Arg('season', () => Int, { nullable: true }) season?: number,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.episodesService.findByCharacterId(
      character.character_id,
      { series, season },
      { first, last, before, after }
    )
  }
}
