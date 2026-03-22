import { Injectable } from '@nestjs/common'

import { queryConnection } from '../common/cursor.helper'
import { PaginationInput } from '../common/pagination.input'
import { DatabaseService } from '../database/database.service'
import { Character, CharacterConnection } from './character.model'

@Injectable()
export class CharactersService {
  constructor(private readonly db: DatabaseService) {}

  private applyFilters(
    items: Character[],
    filters: { gender?: string; primaryActor?: number }
  ): Character[] {
    let result = items
    if (filters.gender != null) result = result.filter((c) => c.gender === filters.gender)
    if (filters.primaryActor != null)
      result = result.filter((c) => c.primary_actor_id === filters.primaryActor)
    return result
  }

  findAll(
    filters: { gender?: string; primaryActor?: number } = {},
    pagination: PaginationInput = {}
  ): CharacterConnection {
    const items = this.applyFilters(this.db.getAll('Characters'), filters)
    return queryConnection<Character>(items, 'character_id', 'Character', pagination)
  }

  findById(id: number): Character | undefined {
    return this.db.getById('Characters', id)
  }

  findByEpisodeId(
    episodeId: number,
    filters: { gender?: string; primaryActor?: number } = {},
    pagination: PaginationInput = {}
  ): CharacterConnection {
    const relatedIds = new Set(this.db.getRelatedIds('Character_Episodes', 'episode_id', episodeId))
    const items = this.applyFilters(
      this.db.getAll('Characters').filter((c) => relatedIds.has(c.character_id)),
      filters
    )
    return queryConnection<Character>(items, 'character_id', 'Character', pagination)
  }

  findBySpeciesId(
    speciesId: number,
    filters: { gender?: string; primaryActor?: number } = {},
    pagination: PaginationInput = {}
  ): CharacterConnection {
    const items = this.applyFilters(
      this.db.getAll('Characters').filter((c) => c.species_id === speciesId),
      filters
    )
    return queryConnection<Character>(items, 'character_id', 'Character', pagination)
  }

  findByActorId(
    actorId: number,
    filters: { gender?: string; primaryActor?: number } = {},
    pagination: PaginationInput = {}
  ): CharacterConnection {
    const relatedIds = new Set(this.db.getRelatedIds('Character_Actors', 'actor_id', actorId))
    const items = this.applyFilters(
      this.db.getAll('Characters').filter((c) => relatedIds.has(c.character_id)),
      filters
    )
    return queryConnection<Character>(items, 'character_id', 'Character', pagination)
  }

  findByOrganizationId(
    organizationId: number,
    filters: { gender?: string; primaryActor?: number } = {},
    pagination: PaginationInput = {}
  ): CharacterConnection {
    const relatedIds = new Set(
      this.db.getRelatedIds('Character_Organizations', 'organization_id', organizationId)
    )
    const items = this.applyFilters(
      this.db.getAll('Characters').filter((c) => relatedIds.has(c.character_id)),
      filters
    )
    return queryConnection<Character>(items, 'character_id', 'Character', pagination)
  }
}
