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
    @Inject(forwardRef(() => SeriesService))
    private readonly seriesService: SeriesService,
    @Inject(forwardRef(() => CharactersService))
    private readonly charactersService: CharactersService
  ) {}

  @Query(() => EpisodeConnection, { name: 'episodes' })
  findAll(
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.episodesService.findAll({ first, last, before, after })
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
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.charactersService.findByEpisodeId(episode.episode_id, {
      first,
      last,
      before,
      after,
    })
  }
}
