import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { PageInfo } from '../common/page-info.type';
import { CharacterConnection } from '../characters/character.model';

@ObjectType()
export class Actor {
  @Field(() => ID, { name: 'id' })
  actor_id: number;

  @Field({ name: 'firstName' })
  first_name: string;

  @Field({ name: 'lastName' })
  last_name: string;

  @Field({ nullable: true, name: 'birthDate' })
  birth_date?: string;

  @Field({ nullable: true, name: 'birthPlace' })
  birth_place?: string;

  @Field({ nullable: true })
  bio?: string;

  // Relationship (resolved by @ResolveField)
  @Field(() => CharacterConnection)
  characters: CharacterConnection;
}

@ObjectType()
export class ActorEdge {
  @Field()
  cursor: string;

  @Field(() => Actor)
  node: Actor;
}

@ObjectType()
export class ActorConnection {
  @Field(() => [ActorEdge])
  edges: ActorEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int, { nullable: true })
  totalCount?: number;
}
