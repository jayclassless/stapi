import { ObjectType, Field, Int, ID, Float } from 'type-graphql'

import { CharacterConnection } from '../characters/character.model.js'
import { PageInfo } from '../common/page-info.type.js'

@ObjectType()
export class Episode {
  @Field(() => ID, { name: 'id' })
  episode_id: number

  series_id: number

  @Field(() => String)
  title: string

  @Field(() => Int, { nullable: true })
  season?: number

  @Field(() => Int, { nullable: true, name: 'episodeNumber' })
  episode_number?: number

  @Field(() => String, { nullable: true, name: 'airDate' })
  air_date?: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => Float, { nullable: true, name: 'imdbRating' })
  imdb_rating?: number

  @Field(() => Int, { nullable: true, name: 'imdbVotes' })
  imdb_votes?: number

  @Field(() => String, { nullable: true })
  director?: string

  @Field(() => String, { nullable: true })
  writer?: string

  @Field(() => String, { nullable: true, name: 'imdbId' })
  imdb_id?: string

  // Relationship fields (resolved by @FieldResolver)
  @Field(() => CharacterConnection)
  characters: CharacterConnection
}

@ObjectType()
export class EpisodeEdge {
  @Field(() => String)
  cursor: string

  @Field(() => Episode)
  node: Episode
}

@ObjectType()
export class EpisodeConnection {
  @Field(() => [EpisodeEdge])
  edges: EpisodeEdge[]

  @Field(() => PageInfo)
  pageInfo: PageInfo

  @Field(() => Int)
  totalCount: number
}
