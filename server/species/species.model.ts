import { ObjectType, Field, Int, ID } from 'type-graphql'

import { CharacterConnection } from '../characters/character.model.js'
import { PageInfo } from '../common/page-info.type.js'

@ObjectType()
export class Species {
  @Field(() => ID, { name: 'id' })
  species_id: number

  @Field(() => String)
  name: string

  @Field(() => String, { nullable: true })
  homeworld?: string

  @Field(() => Boolean, { name: 'warpCapable' })
  warp_capable: boolean

  // Relationship (resolved by @FieldResolver)
  @Field(() => CharacterConnection)
  characters: CharacterConnection
}

@ObjectType()
export class SpeciesEdge {
  @Field(() => String)
  cursor: string

  @Field(() => Species)
  node: Species
}

@ObjectType()
export class SpeciesConnection {
  @Field(() => [SpeciesEdge])
  edges: SpeciesEdge[]

  @Field(() => PageInfo)
  pageInfo: PageInfo

  @Field(() => Int)
  totalCount: number
}
