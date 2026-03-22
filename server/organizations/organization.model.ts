import { ObjectType, Field, Int, ID } from 'type-graphql'

import { CharacterConnection } from '../characters/character.model.js'
import { PageInfo } from '../common/page-info.type.js'

@ObjectType()
export class Organization {
  @Field(() => ID, { name: 'id' })
  organization_id: number

  @Field(() => String)
  name: string

  @Field(() => String, { nullable: true })
  type?: string

  // Relationship (resolved by @FieldResolver)
  @Field(() => CharacterConnection)
  characters: CharacterConnection
}

@ObjectType()
export class OrganizationEdge {
  @Field(() => String)
  cursor: string

  @Field(() => Organization)
  node: Organization
}

@ObjectType()
export class OrganizationConnection {
  @Field(() => [OrganizationEdge])
  edges: OrganizationEdge[]

  @Field(() => PageInfo)
  pageInfo: PageInfo

  @Field(() => Int)
  totalCount: number
}
