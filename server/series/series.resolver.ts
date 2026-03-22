import { GraphQLError } from 'graphql'
import { Resolver, Query, Arg, Int, FieldResolver, Root } from 'type-graphql'

import { EpisodeConnection } from '../episodes/episode.model.js'
import { EpisodesService } from '../episodes/episodes.service.js'
import { Series, SeriesConnection } from './series.model.js'
import { SeriesService } from './series.service.js'

@Resolver(() => Series)
export class SeriesResolver {
  constructor(
    private readonly seriesService: SeriesService,
    private readonly episodesService: EpisodesService
  ) {}

  @Query(() => SeriesConnection, { name: 'series' })
  findAll(
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.seriesService.findAll({ first, last, before, after })
  }

  @Query(() => Series, { name: 'seriesById', nullable: true })
  findById(
    @Arg('id', () => Int, { nullable: true }) id?: number,
    @Arg('abbreviation', () => String, { nullable: true }) abbreviation?: string,
    @Arg('imdbId', () => String, { nullable: true }) imdbId?: string
  ) {
    const args = [id, abbreviation, imdbId].filter((v) => v != null)
    if (args.length !== 1) {
      throw new GraphQLError('Exactly one of id, abbreviation, or imdbId is required', {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }
    if (id != null) return this.seriesService.findById(id)
    if (abbreviation != null) return this.seriesService.findByAbbreviation(abbreviation)
    return this.seriesService.findByImdbId(imdbId!)
  }

  @FieldResolver(() => EpisodeConnection)
  episodes(
    @Root() series: Series,
    @Arg('season', () => Int, { nullable: true }) season?: number,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.episodesService.findBySeriesId(
      series.series_id,
      { season },
      { first, last, before, after }
    )
  }
}
