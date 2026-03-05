import { Injectable } from '@nestjs/common'

import { queryConnection } from '../common/cursor.helper'
import { PaginationInput } from '../common/pagination.input'
import { DatabaseService, SqlParam } from '../database/database.service'
import { Character, CharacterConnection } from './character.model'

@Injectable()
export class CharactersService {
  constructor(private readonly db: DatabaseService) {}

  findAll(
    filters: { gender?: string; primaryActor?: number } = {},
    pagination: PaginationInput = {}
  ): CharacterConnection {
    const conditions: string[] = []
    const params: SqlParam[] = []
    if (filters.gender != null) {
      conditions.push('gender = ?')
      params.push(filters.gender)
    }
    if (filters.primaryActor != null) {
      conditions.push('primary_actor_id = ?')
      params.push(filters.primaryActor)
    }
    const whereSql = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
    return queryConnection<Character>(
      this.db,
      `SELECT * FROM Characters${whereSql}`,
      params,
      'character_id',
      'Character',
      pagination
    )
  }

  findById(id: number): Character | undefined {
    return this.db.queryOne<Character>('SELECT * FROM Characters WHERE character_id = ?', [id])
  }

  findByEpisodeId(
    episodeId: number,
    filters: { gender?: string; primaryActor?: number } = {},
    pagination: PaginationInput = {}
  ): CharacterConnection {
    const params: SqlParam[] = [episodeId]
    const andConds: string[] = []
    if (filters.gender != null) {
      andConds.push('c.gender = ?')
      params.push(filters.gender)
    }
    if (filters.primaryActor != null) {
      andConds.push('c.primary_actor_id = ?')
      params.push(filters.primaryActor)
    }
    const andSql = andConds.length ? ` AND ${andConds.join(' AND ')}` : ''
    return queryConnection<Character>(
      this.db,
      `SELECT c.* FROM Characters c JOIN Character_Episodes ce ON ce.character_id = c.character_id WHERE ce.episode_id = ?${andSql}`,
      params,
      'character_id',
      'Character',
      pagination
    )
  }

  findBySpeciesId(
    speciesId: number,
    filters: { gender?: string; primaryActor?: number } = {},
    pagination: PaginationInput = {}
  ): CharacterConnection {
    const params: SqlParam[] = [speciesId]
    const andConds: string[] = []
    if (filters.gender != null) {
      andConds.push('gender = ?')
      params.push(filters.gender)
    }
    if (filters.primaryActor != null) {
      andConds.push('primary_actor_id = ?')
      params.push(filters.primaryActor)
    }
    const andSql = andConds.length ? ` AND ${andConds.join(' AND ')}` : ''
    return queryConnection<Character>(
      this.db,
      `SELECT * FROM Characters WHERE species_id = ?${andSql}`,
      params,
      'character_id',
      'Character',
      pagination
    )
  }

  findByActorId(
    actorId: number,
    filters: { gender?: string; primaryActor?: number } = {},
    pagination: PaginationInput = {}
  ): CharacterConnection {
    const params: SqlParam[] = [actorId]
    const andConds: string[] = []
    if (filters.gender != null) {
      andConds.push('c.gender = ?')
      params.push(filters.gender)
    }
    if (filters.primaryActor != null) {
      andConds.push('c.primary_actor_id = ?')
      params.push(filters.primaryActor)
    }
    const andSql = andConds.length ? ` AND ${andConds.join(' AND ')}` : ''
    return queryConnection<Character>(
      this.db,
      `SELECT c.* FROM Characters c JOIN Character_Actors ca ON ca.character_id = c.character_id WHERE ca.actor_id = ?${andSql}`,
      params,
      'character_id',
      'Character',
      pagination
    )
  }

  findByOrganizationId(
    organizationId: number,
    filters: { gender?: string; primaryActor?: number } = {},
    pagination: PaginationInput = {}
  ): CharacterConnection {
    const params: SqlParam[] = [organizationId]
    const andConds: string[] = []
    if (filters.gender != null) {
      andConds.push('c.gender = ?')
      params.push(filters.gender)
    }
    if (filters.primaryActor != null) {
      andConds.push('c.primary_actor_id = ?')
      params.push(filters.primaryActor)
    }
    const andSql = andConds.length ? ` AND ${andConds.join(' AND ')}` : ''
    return queryConnection<Character>(
      this.db,
      `SELECT c.* FROM Characters c JOIN Character_Organizations co ON co.character_id = c.character_id WHERE co.organization_id = ?${andSql}`,
      params,
      'character_id',
      'Character',
      pagination
    )
  }
}
