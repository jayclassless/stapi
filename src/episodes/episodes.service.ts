import { Injectable } from '@nestjs/common'

import { queryConnection } from '../common/cursor.helper'
import { PaginationInput } from '../common/pagination.input'
import { DatabaseService } from '../database/database.service'
import { Episode, EpisodeConnection } from './episode.model'

@Injectable()
export class EpisodesService {
  constructor(private readonly db: DatabaseService) {}

  findAll(
    filters: { series?: number; season?: number } = {},
    pagination: PaginationInput = {}
  ): EpisodeConnection {
    const conditions: string[] = []
    const params: unknown[] = []
    if (filters.series != null) {
      conditions.push('series_id = ?')
      params.push(filters.series)
    }
    if (filters.season != null) {
      conditions.push('season = ?')
      params.push(filters.season)
    }
    const whereSql = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
    return queryConnection<Episode>(
      this.db,
      `SELECT * FROM Episodes${whereSql}`,
      params,
      'episode_id',
      'Episode',
      pagination
    )
  }

  findById(id: number): Episode | undefined {
    return this.db.queryOne<Episode>('SELECT * FROM Episodes WHERE episode_id = ?', [id])
  }

  findBySeriesId(
    seriesId: number,
    filters: { series?: number; season?: number } = {},
    pagination: PaginationInput = {}
  ): EpisodeConnection {
    const params: unknown[] = [seriesId]
    const andConds: string[] = []
    if (filters.series != null) {
      andConds.push('series_id = ?')
      params.push(filters.series)
    }
    if (filters.season != null) {
      andConds.push('season = ?')
      params.push(filters.season)
    }
    const andSql = andConds.length ? ` AND ${andConds.join(' AND ')}` : ''
    return queryConnection<Episode>(
      this.db,
      `SELECT * FROM Episodes WHERE series_id = ?${andSql}`,
      params,
      'episode_id',
      'Episode',
      pagination
    )
  }

  findByCharacterId(
    characterId: number,
    filters: { series?: number; season?: number } = {},
    pagination: PaginationInput = {}
  ): EpisodeConnection {
    const params: unknown[] = [characterId]
    const andConds: string[] = []
    if (filters.series != null) {
      andConds.push('e.series_id = ?')
      params.push(filters.series)
    }
    if (filters.season != null) {
      andConds.push('e.season = ?')
      params.push(filters.season)
    }
    const andSql = andConds.length ? ` AND ${andConds.join(' AND ')}` : ''
    return queryConnection<Episode>(
      this.db,
      `SELECT e.* FROM Episodes e JOIN Character_Episodes ce ON ce.episode_id = e.episode_id WHERE ce.character_id = ?${andSql}`,
      params,
      'episode_id',
      'Episode',
      pagination
    )
  }
}
