import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { PageInfo } from '../common/page-info.type';
import { CharacterConnection } from '../characters/character.model';

@ObjectType()
export class Organization {
  @Field(() => ID, { name: 'id' })
  organization_id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  type?: string;

  // Relationship (resolved by @ResolveField)
  @Field(() => CharacterConnection)
  characters: CharacterConnection;
}

@ObjectType()
export class OrganizationEdge {
  @Field()
  cursor: string;

  @Field(() => Organization)
  node: Organization;
}

@ObjectType()
export class OrganizationConnection {
  @Field(() => [OrganizationEdge])
  edges: OrganizationEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int, { nullable: true })
  totalCount?: number;
}
