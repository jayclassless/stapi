import { Resolver, Query, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { Inject, forwardRef } from '@nestjs/common';
import { UserInputError } from '@nestjs/apollo';
import { SeriesService } from './series.service';
import { Series, SeriesConnection } from './series.model';
import { EpisodeConnection } from '../episodes/episode.model';
import { EpisodesService } from '../episodes/episodes.service';

@Resolver(() => Series)
export class SeriesResolver {
  constructor(
    private readonly seriesService: SeriesService,
    @Inject(forwardRef(() => EpisodesService))
    private readonly episodesService: EpisodesService,
  ) {}

  @Query(() => SeriesConnection, { name: 'series' })
  findAll(
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string,
  ) {
    return this.seriesService.findAll({ first, last, before, after });
  }

  @Query(() => Series, { name: 'seriesById', nullable: true })
  findById(
    @Args('id', { type: () => Int, nullable: true }) id?: number,
    @Args('abbreviation', { nullable: true }) abbreviation?: string,
  ) {
    const hasId = id != null;
    const hasAbbreviation = abbreviation != null;
    if (hasId === hasAbbreviation) {
      throw new UserInputError('Exactly one of id or abbreviation is required');
    }
    if (hasId) return this.seriesService.findById(id);
    return this.seriesService.findByAbbreviation(abbreviation!);
  }

  @ResolveField(() => EpisodeConnection)
  episodes(
    @Parent() series: Series,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string,
  ) {
    return this.episodesService.findBySeriesId(series.series_id, { first, last, before, after });
  }
}
