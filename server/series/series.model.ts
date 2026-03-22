import { ObjectType, Field, Int, ID } from 'type-graphql'

import { PageInfo } from '../common/page-info.type.js'
import { EpisodeConnection } from '../episodes/episode.model.js'

@ObjectType()
export class Series {
  @Field(() => ID, { name: 'id' })
  series_id: number

  @Field(() => String)
  name: string

  @Field(() => String, { nullable: true })
  abbreviation?: string

  @Field(() => Int, { nullable: true, name: 'startYear' })
  start_year?: number

  @Field(() => Int, { nullable: true, name: 'endYear' })
  end_year?: number

  @Field(() => Int, { nullable: true, name: 'numSeasons' })
  num_seasons?: number

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => String, { nullable: true, name: 'imdbId' })
  imdb_id?: string

  // Relationship (resolved by @FieldResolver)
  @Field(() => EpisodeConnection)
  episodes: EpisodeConnection
}

@ObjectType()
export class SeriesEdge {
  @Field(() => String)
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

  @Field(() => Int)
  totalCount: number
}
