import { UserInputError } from '@nestjs/apollo'
import { Inject, forwardRef } from '@nestjs/common'
import { Resolver, Query, Args, Int, ResolveField, Parent } from '@nestjs/graphql'

import { EpisodeConnection } from '../episodes/episode.model'
import { EpisodesService } from '../episodes/episodes.service'
import { Series, SeriesConnection } from './series.model'
import { SeriesService } from './series.service'

@Resolver(() => Series)
export class SeriesResolver {
  constructor(
    private readonly seriesService: SeriesService,
    /* v8 ignore start */
    @Inject(forwardRef(() => EpisodesService))
    /* v8 ignore stop */
    private readonly episodesService: EpisodesService
  ) {}

  @Query(() => SeriesConnection, { name: 'series' })
  findAll(
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.seriesService.findAll({ first, last, before, after })
  }

  @Query(() => Series, { name: 'seriesById', nullable: true })
  findById(
    @Args('id', { type: () => Int, nullable: true }) id?: number,
    @Args('abbreviation', { nullable: true }) abbreviation?: string,
    @Args('imdbId', { nullable: true }) imdbId?: string
  ) {
    const args = [id, abbreviation, imdbId].filter((v) => v != null)
    if (args.length !== 1) {
      throw new UserInputError('Exactly one of id, abbreviation, or imdbId is required')
    }
    if (id != null) return this.seriesService.findById(id)
    if (abbreviation != null) return this.seriesService.findByAbbreviation(abbreviation)
    return this.seriesService.findByImdbId(imdbId!)
  }

  @ResolveField(() => EpisodeConnection)
  episodes(
    @Parent() series: Series,
    @Args('season', { nullable: true, type: () => Int }) season?: number,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.episodesService.findBySeriesId(
      series.series_id,
      { season },
      { first, last, before, after }
    )
  }
}
