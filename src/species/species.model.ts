import { ObjectType, Field, Int, ID } from '@nestjs/graphql'

import { CharacterConnection } from '../characters/character.model'
import { PageInfo } from '../common/page-info.type'

@ObjectType()
export class Species {
  @Field(() => ID, { name: 'id' })
  species_id: number

  @Field()
  name: string

  @Field({ nullable: true })
  homeworld?: string

  @Field({ name: 'warpCapable' })
  warp_capable: boolean

  // Relationship (resolved by @ResolveField)
  @Field(() => CharacterConnection)
  characters: CharacterConnection
}

@ObjectType()
export class SpeciesEdge {
  @Field()
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

  @Field(() => Int, { nullable: true })
  totalCount?: number
}
