import { ObjectType, Field, Int, ID, Float } from '@nestjs/graphql';
import { PageInfo } from '../common/page-info.type';
import { CharacterConnection } from '../characters/character.model';

@ObjectType()
export class Episode {
  @Field(() => ID, { name: 'id' })
  episode_id: number;

  @Field(() => Int, { name: 'seriesId' })
  series_id: number;

  @Field()
  title: string;

  @Field(() => Int, { nullable: true })
  season?: number;

  @Field(() => Int, { nullable: true, name: 'episodeNumber' })
  episode_number?: number;

  @Field({ nullable: true, name: 'airDate' })
  air_date?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true, name: 'imdbRating' })
  imdb_rating?: number;

  @Field(() => Int, { nullable: true, name: 'imdbVotes' })
  imdb_votes?: number;

  @Field({ nullable: true })
  director?: string;

  @Field({ nullable: true })
  writer?: string;

  @Field({ nullable: true, name: 'imdbId' })
  imdb_id?: string;

  // Relationship fields (resolved by @ResolveField)
  @Field(() => CharacterConnection)
  characters: CharacterConnection;
}

@ObjectType()
export class EpisodeEdge {
  @Field()
  cursor: string;

  @Field(() => Episode)
  node: Episode;
}

@ObjectType()
export class EpisodeConnection {
  @Field(() => [EpisodeEdge])
  edges: EpisodeEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int, { nullable: true })
  totalCount?: number;
}
