import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ShipsService } from './ships.service';
import { Ship, ShipConnection } from './ship.model';

@Resolver(() => Ship)
export class ShipsResolver {
  constructor(private readonly shipsService: ShipsService) {}

  @Query(() => ShipConnection, { name: 'ships' })
  findAll(
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string,
  ) {
    return this.shipsService.findAll({ first, last, before, after });
  }

  @Query(() => Ship, { name: 'ship', nullable: true })
  findById(@Args('id', { type: () => Int }) id: number) {
    return this.shipsService.findById(id);
  }
}
