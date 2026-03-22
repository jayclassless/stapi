import { ObjectType, Field, Int, ID } from 'type-graphql'

import { Actor, ActorConnection } from '../actors/actor.model.js'
import { PageInfo } from '../common/page-info.type.js'
import { OrganizationConnection } from '../organizations/organization.model.js'
import { Species } from '../species/species.model.js'

@ObjectType()
export class Character {
  @Field(() => ID, { name: 'id' })
  character_id: number

  @Field(() => String)
  name: string

  @Field(() => String, { nullable: true })
  rank?: string

  @Field(() => String, { nullable: true })
  title?: string

  @Field(() => Int, { nullable: true, name: 'speciesId' })
  species_id?: number

  @Field(() => Int, { nullable: true, name: 'birthYear' })
  birth_year?: number

  @Field(() => Int, { nullable: true, name: 'deathYear' })
  death_year?: number

  @Field(() => String, { nullable: true })
  gender?: string

  @Field(() => String, { nullable: true })
  occupation?: string

  primary_actor_id?: number

  // Relationship fields (resolved by @FieldResolver)
  @Field(() => Species, { nullable: true })
  species?: Species

  @Field(() => Actor, { nullable: true })
  primaryActor?: Actor

  @Field(() => ActorConnection)
  actors: ActorConnection

  @Field(() => OrganizationConnection)
  organizations: OrganizationConnection
}

@ObjectType()
export class CharacterEdge {
  @Field(() => String)
  cursor: string

  @Field(() => Character)
  node: Character
}

@ObjectType()
export class CharacterConnection {
  @Field(() => [CharacterEdge])
  edges: CharacterEdge[]

  @Field(() => PageInfo)
  pageInfo: PageInfo

  @Field(() => Int)
  totalCount: number
}
