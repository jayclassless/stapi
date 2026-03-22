import { ObjectType, Field, Int, ID } from 'type-graphql'

import { PageInfo } from '../common/page-info.type.js'

@ObjectType()
export class Ship {
  @Field(() => ID, { name: 'id' })
  ship_id: number

  @Field(() => String)
  name: string

  @Field(() => String, { nullable: true })
  registry?: string

  @Field(() => String, { nullable: true })
  class?: string

  @Field(() => String, { nullable: true })
  type?: string

  @Field(() => Int, { nullable: true, name: 'launchedYear' })
  launched_year?: number

  @Field(() => String, { nullable: true })
  status?: string
}

@ObjectType()
export class ShipEdge {
  @Field(() => String)
  cursor: string

  @Field(() => Ship)
  node: Ship
}

@ObjectType()
export class ShipConnection {
  @Field(() => [ShipEdge])
  edges: ShipEdge[]

  @Field(() => PageInfo)
  pageInfo: PageInfo

  @Field(() => Int)
  totalCount: number
}
