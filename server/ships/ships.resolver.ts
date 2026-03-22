import { Resolver, Query, Arg, Int } from 'type-graphql'

import { Ship, ShipConnection } from './ship.model.js'
import { ShipsService } from './ships.service.js'

@Resolver(() => Ship)
export class ShipsResolver {
  constructor(private readonly shipsService: ShipsService) {}

  @Query(() => ShipConnection, { name: 'ships' })
  findAll(
    @Arg('status', () => String, { nullable: true }) status?: string,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.shipsService.findAll({ status }, { first, last, before, after })
  }

  @Query(() => Ship, { name: 'ship', nullable: true })
  findById(@Arg('id', () => Int) id: number) {
    return this.shipsService.findById(id)
  }
}
