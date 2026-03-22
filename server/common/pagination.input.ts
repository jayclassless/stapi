import { InputType, Field, Int } from 'type-graphql'

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true })
  first?: number

  @Field(() => Int, { nullable: true })
  last?: number

  @Field(() => String, { nullable: true })
  before?: string

  @Field(() => String, { nullable: true })
  after?: string
}
