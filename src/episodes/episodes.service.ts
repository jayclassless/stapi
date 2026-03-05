import { Injectable } from '@nestjs/common'

import { queryConnection } from '../common/cursor.helper'
import { PaginationInput } from '../common/pagination.input'
import { DatabaseService, SqlParam } from '../database/database.service'
import { Episode, EpisodeConnection } from './episode.model'

@Injectable()
export class EpisodesService {
  constructor(private readonly db: DatabaseService) {}

  findAll(
    filters: { series?: number; season?: number } = {},
    pagination: PaginationInput = {}
  ): EpisodeConnection {
    const conditions: string[] = []
    const params: SqlParam[] = []
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

  findByIds(ids: number[]): Episode[] {
    if (ids.length === 0) return []
    const placeholders = ids.map(() => '?').join(',')
    const rows = this.db.query<Episode>(
      `SELECT * FROM Episodes WHERE episode_id IN (${placeholders})`,
      ids
    )
    const byId = new Map(rows.map((e) => [e.episode_id, e]))
    return ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []))
  }

  findBySeriesId(
    seriesId: number,
    filters: { series?: number; season?: number } = {},
    pagination: PaginationInput = {}
  ): EpisodeConnection {
    const params: SqlParam[] = [seriesId]
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

  getRandomEpisode(): Episode | undefined {
    const total = this.db.count('SELECT COUNT(*) AS count FROM Episodes', [])
    if (total === 0) return undefined
    const offset = Math.floor(Math.random() * total)
    return this.db.queryOne<Episode>('SELECT * FROM Episodes LIMIT 1 OFFSET ?', [offset])
  }

  async *randomEpisodeStream(count: number): AsyncGenerator<Episode> {
    for (let i = 0; i < count; i++) {
      await new Promise<void>((r) => setTimeout(r, 3000))
      const episode = this.getRandomEpisode()
      if (episode) yield episode
    }
  }

  findByCharacterId(
    characterId: number,
    filters: { series?: number; season?: number } = {},
    pagination: PaginationInput = {}
  ): EpisodeConnection {
    const params: SqlParam[] = [characterId]
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
