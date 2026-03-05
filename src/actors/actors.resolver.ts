import { Inject, forwardRef } from '@nestjs/common'
import { Resolver, Query, Args, Int, ResolveField, Parent } from '@nestjs/graphql'

import { CharacterConnection } from '../characters/character.model'
import { CharactersService } from '../characters/characters.service'
import { Actor, ActorConnection } from './actor.model'
import { ActorsService } from './actors.service'

@Resolver(() => Actor)
export class ActorsResolver {
  constructor(
    private readonly actorsService: ActorsService,
    @Inject(forwardRef(() => CharactersService))
    private readonly charactersService: CharactersService
  ) {}

  @Query(() => ActorConnection, { name: 'actors' })
  findAll(
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.actorsService.findAll({ first, last, before, after })
  }

  @Query(() => Actor, { name: 'actor', nullable: true })
  findById(@Args('id', { type: () => Int }) id: number) {
    return this.actorsService.findById(id)
  }

  @ResolveField(() => CharacterConnection)
  characters(
    @Parent() actor: Actor,
    @Args('first', { nullable: true, type: () => Int }) first?: number,
    @Args('last', { nullable: true, type: () => Int }) last?: number,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string
  ) {
    return this.charactersService.findByActorId(actor.actor_id, { first, last, before, after })
  }
}
