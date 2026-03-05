import { Injectable } from '@nestjs/common'

import { queryConnection } from '../common/cursor.helper'
import { PaginationInput } from '../common/pagination.input'
import { DatabaseService } from '../database/database.service'
import { Character, CharacterConnection } from './character.model'

@Injectable()
export class CharactersService {
  constructor(private readonly db: DatabaseService) {}

  findAll(pagination: PaginationInput = {}): CharacterConnection {
    return queryConnection<Character>(
      this.db,
      'SELECT * FROM Characters',
      [],
      'character_id',
      'Character',
      pagination
    )
  }

  findById(id: number): Character | undefined {
    return this.db.queryOne<Character>('SELECT * FROM Characters WHERE character_id = ?', [id])
  }

  findByEpisodeId(episodeId: number, pagination: PaginationInput = {}): CharacterConnection {
    return queryConnection<Character>(
      this.db,
      'SELECT c.* FROM Characters c JOIN Character_Episodes ce ON ce.character_id = c.character_id WHERE ce.episode_id = ?',
      [episodeId],
      'character_id',
      'Character',
      pagination
    )
  }

  findBySpeciesId(speciesId: number, pagination: PaginationInput = {}): CharacterConnection {
    return queryConnection<Character>(
      this.db,
      'SELECT * FROM Characters WHERE species_id = ?',
      [speciesId],
      'character_id',
      'Character',
      pagination
    )
  }

  findByActorId(actorId: number, pagination: PaginationInput = {}): CharacterConnection {
    return queryConnection<Character>(
      this.db,
      'SELECT c.* FROM Characters c JOIN Character_Actors ca ON ca.character_id = c.character_id WHERE ca.actor_id = ?',
      [actorId],
      'character_id',
      'Character',
      pagination
    )
  }

  findByOrganizationId(
    organizationId: number,
    pagination: PaginationInput = {}
  ): CharacterConnection {
    return queryConnection<Character>(
      this.db,
      'SELECT c.* FROM Characters c JOIN Character_Organizations co ON co.character_id = c.character_id WHERE co.organization_id = ?',
      [organizationId],
      'character_id',
      'Character',
      pagination
    )
  }
}
