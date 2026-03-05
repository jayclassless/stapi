import { ObjectType, Field, Int, ID } from '@nestjs/graphql'

import { PageInfo } from '../common/page-info.type'

@ObjectType()
export class Ship {
  @Field(() => ID, { name: 'id' })
  ship_id: number

  @Field()
  name: string

  @Field({ nullable: true })
  registry?: string

  @Field({ nullable: true })
  class?: string

  @Field({ nullable: true })
  type?: string

  @Field(() => Int, { nullable: true, name: 'launchedYear' })
  launched_year?: number

  @Field({ nullable: true })
  status?: string
}

@ObjectType()
export class ShipEdge {
  @Field()
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
