import { ObjectType, Field, Int, ID } from 'type-graphql'

import { CharacterConnection } from '../characters/character.model.js'
import { PageInfo } from '../common/page-info.type.js'

@ObjectType()
export class Actor {
  @Field(() => ID, { name: 'id' })
  actor_id: number

  @Field(() => String, { name: 'firstName' })
  first_name: string

  @Field(() => String, { name: 'lastName' })
  last_name: string

  @Field(() => String, { nullable: true, name: 'birthDate' })
  birth_date?: string

  @Field(() => String, { nullable: true, name: 'birthPlace' })
  birth_place?: string

  @Field(() => String, { nullable: true })
  bio?: string

  // Relationship (resolved by @FieldResolver)
  @Field(() => CharacterConnection)
  characters: CharacterConnection
}

@ObjectType()
export class ActorEdge {
  @Field(() => String)
  cursor: string

  @Field(() => Actor)
  node: Actor
}

@ObjectType()
export class ActorConnection {
  @Field(() => [ActorEdge])
  edges: ActorEdge[]

  @Field(() => PageInfo)
  pageInfo: PageInfo

  @Field(() => Int)
  totalCount: number
}
