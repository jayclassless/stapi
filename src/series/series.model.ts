import { ObjectType, Field, Int, ID } from '@nestjs/graphql'

import { PageInfo } from '../common/page-info.type'
import { EpisodeConnection } from '../episodes/episode.model'

@ObjectType()
export class Series {
  @Field(() => ID, { name: 'id' })
  series_id: number

  @Field()
  name: string

  @Field({ nullable: true })
  abbreviation?: string

  @Field(() => Int, { nullable: true, name: 'startYear' })
  start_year?: number

  @Field(() => Int, { nullable: true, name: 'endYear' })
  end_year?: number

  @Field(() => Int, { nullable: true, name: 'numSeasons' })
  num_seasons?: number

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true, name: 'imdbId' })
  imdb_id?: string

  // Relationship (resolved by @ResolveField)
  @Field(() => EpisodeConnection)
  episodes: EpisodeConnection
}

@ObjectType()
export class SeriesEdge {
  @Field()
  cursor: string

  @Field(() => Series)
  node: Series
}

@ObjectType()
export class SeriesConnection {
  @Field(() => [SeriesEdge])
  edges: SeriesEdge[]

  @Field(() => PageInfo)
  pageInfo: PageInfo

  @Field(() => Int, { nullable: true })
  totalCount?: number
}
