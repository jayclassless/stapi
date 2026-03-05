import { InputType, Field, Int } from '@nestjs/graphql'

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true })
  first?: number

  @Field(() => Int, { nullable: true })
  last?: number

  @Field({ nullable: true })
  before?: string

  @Field({ nullable: true })
  after?: string
}
