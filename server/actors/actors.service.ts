import { queryConnection } from '../common/cursor.helper.js'
import { PaginationInput } from '../common/pagination.input.js'
import { DatabaseService } from '../database/database.service.js'
import { Actor, ActorConnection } from './actor.model.js'

export class ActorsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(pagination: PaginationInput = {}): ActorConnection {
    return queryConnection<Actor>(this.db.getAll('Actors'), 'actor_id', 'Actor', pagination)
  }

  findById(id: number): Actor | undefined {
    return this.db.getById('Actors', id)
  }

  findByCharacterId(characterId: number, pagination: PaginationInput = {}): ActorConnection {
    const relatedIds = new Set(
      this.db.getRelatedIds('Character_Actors', 'character_id', characterId)
    )
    const items = this.db.getAll('Actors').filter((a) => relatedIds.has(a.actor_id))
    return queryConnection<Actor>(items, 'actor_id', 'Actor', pagination)
  }
}
