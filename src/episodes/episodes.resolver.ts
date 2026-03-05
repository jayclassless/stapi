import { Inject, forwardRef } from '@nestjs/common'
import { Resolver, Query, Args, Int, ResolveField, Parent } from '@nestjs/graphql'

import { CharacterConnection } from '../characters/character.model'
import { CharactersService } from '../characters/characters.service'
import { Series } from '../series/series.model'
import { SeriesService } from '../series/series.service'
import { Episode, EpisodeConnection } from './episode.model'
import { EpisodesService } from './episodes.service'

@Resolver(() => Episode)
export class EpisodesResolver {
  constructor(
    private readonly episodesService: EpisodesService,
    /* v8 ignore start */
    @Inject(forwardRef(() => SeriesService))
    /* v8 ignore stop */
    private readonly seriesService: SeriesService,
    /* v8 ignore start */
    @Inject(forwardRef(() => CharactersService))
    /* v8 ignore stop */
    private readonly charactersService: CharactersService
  ) {}

  @Query(() => EpisodeConnection, { name: 'episodes' })
  findAll(
    @Args('series', { nullable: true, type: () => Int }) series?: number,
    @Args('season', { nullable: true, type: () => Int }) season?: number,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.episodesService.findAll({ series, season }, { first, last, before, after })
  }

  @Query(() => Episode, { name: 'episode', nullable: true })
  findById(@Args('id', { type: () => Int }) id: number) {
    return this.episodesService.findById(id)
  }

  @ResolveField(() => Series, { nullable: true })
  series(@Parent() episode: Episode) {
    return this.seriesService.findById(episode.series_id)
  }

  @ResolveField(() => CharacterConnection)
  characters(
    @Parent() episode: Episode,
    @Args('gender', { nullable: true }) gender?: string,
    @Args('primaryActor', { nullable: true, type: () => Int }) primaryActor?: number,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.charactersService.findByEpisodeId(
      episode.episode_id,
      { gender, primaryActor },
      { first, last, before, after }
    )
  }
}
