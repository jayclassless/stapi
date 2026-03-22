import { Resolver, Query, Arg, Int, FieldResolver, Root, Subscription } from 'type-graphql'

import { CharacterConnection } from '../characters/character.model.js'
import { CharactersService } from '../characters/characters.service.js'
import { Series } from '../series/series.model.js'
import { SeriesService } from '../series/series.service.js'
import { Episode, EpisodeConnection } from './episode.model.js'
import { EpisodesService } from './episodes.service.js'

@Resolver(() => Episode)
export class EpisodesResolver {
  constructor(
    private readonly episodesService: EpisodesService,
    private readonly seriesService: SeriesService,
    private readonly charactersService: CharactersService
  ) {}

  @Query(() => EpisodeConnection, { name: 'episodes' })
  findAll(
    @Arg('series', () => Int, { nullable: true }) series?: number,
    @Arg('season', () => Int, { nullable: true }) season?: number,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.episodesService.findAll({ series, season }, { first, last, before, after })
  }

  @Query(() => Episode, { name: 'episode', nullable: true })
  findById(@Arg('id', () => Int) id: number) {
    return this.episodesService.findById(id)
  }

  @Subscription(() => Episode, {
    name: 'randomEpisode',
    subscribe: ({
      args,
      context,
    }: {
      args: { count: number }
      context: { episodesService: EpisodesService }
    }) => context.episodesService.randomEpisodeStream(Math.min(args.count, 100)),
  })
  randomEpisode(
    @Root() episode: Episode,
    @Arg('count', () => Int, { defaultValue: 10 }) _count: number
  ): Episode {
    return episode
  }

  @FieldResolver(() => Series, { nullable: true })
  series(@Root() episode: Episode) {
    return this.seriesService.findById(episode.series_id)
  }

  @FieldResolver(() => CharacterConnection)
  characters(
    @Root() episode: Episode,
    @Arg('gender', () => String, { nullable: true }) gender?: string,
    @Arg('primaryActor', () => Int, { nullable: true }) primaryActor?: number,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.charactersService.findByEpisodeId(
      episode.episode_id,
      { gender, primaryActor },
      { first, last, before, after }
    )
  }
}
