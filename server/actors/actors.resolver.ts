import { Resolver, Query, Arg, Int, FieldResolver, Root } from 'type-graphql'

import { CharacterConnection } from '../characters/character.model.js'
import { CharactersService } from '../characters/characters.service.js'
import { Actor, ActorConnection } from './actor.model.js'
import { ActorsService } from './actors.service.js'

@Resolver(() => Actor)
export class ActorsResolver {
  constructor(
    private readonly actorsService: ActorsService,
    private readonly charactersService: CharactersService
  ) {}

  @Query(() => ActorConnection, { name: 'actors' })
  findAll(
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.actorsService.findAll({ first, last, before, after })
  }

  @Query(() => Actor, { name: 'actor', nullable: true })
  findById(@Arg('id', () => Int) id: number) {
    return this.actorsService.findById(id)
  }

  @FieldResolver(() => CharacterConnection)
  characters(
    @Root() actor: Actor,
    @Arg('gender', () => String, { nullable: true }) gender?: string,
    @Arg('primaryActor', () => Int, { nullable: true }) primaryActor?: number,
    @Arg('first', () => Int, { nullable: true }) first?: number,
    @Arg('last', () => Int, { nullable: true }) last?: number,
    @Arg('before', () => String, { nullable: true }) before?: string,
    @Arg('after', () => String, { nullable: true }) after?: string
  ) {
    return this.charactersService.findByActorId(
      actor.actor_id,
      { gender, primaryActor },
      { first, last, before, after }
    )
  }
}
