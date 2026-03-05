import { ObjectType, Field, Int, ID } from '@nestjs/graphql'

import { Actor, ActorConnection } from '../actors/actor.model'
import { PageInfo } from '../common/page-info.type'
import { OrganizationConnection } from '../organizations/organization.model'
import { Species } from '../species/species.model'

@ObjectType()
export class Character {
  @Field(() => ID, { name: 'id' })
  character_id: number

  @Field()
  name: string

  @Field({ nullable: true })
  rank?: string

  @Field({ nullable: true })
  title?: string

  @Field(() => Int, { nullable: true, name: 'speciesId' })
  species_id?: number

  @Field(() => Int, { nullable: true, name: 'birthYear' })
  birth_year?: number

  @Field(() => Int, { nullable: true, name: 'deathYear' })
  death_year?: number

  @Field({ nullable: true })
  gender?: string

  @Field({ nullable: true })
  occupation?: string

  primary_actor_id?: number

  // Relationship fields (resolved by @ResolveField)
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
  @Field()
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
