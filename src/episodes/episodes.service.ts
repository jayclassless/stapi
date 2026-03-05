import { Injectable } from '@nestjs/common'

import { queryConnection } from '../common/cursor.helper'
import { PaginationInput } from '../common/pagination.input'
import { DatabaseService } from '../database/database.service'
import { Episode, EpisodeConnection } from './episode.model'

@Injectable()
export class EpisodesService {
  constructor(private readonly db: DatabaseService) {}

  findAll(pagination: PaginationInput = {}): EpisodeConnection {
    return queryConnection<Episode>(
      this.db,
      'SELECT * FROM Episodes',
      [],
      'episode_id',
      'Episode',
      pagination
    )
  }

  findById(id: number): Episode | undefined {
    return this.db.queryOne<Episode>('SELECT * FROM Episodes WHERE episode_id = ?', [id])
  }

  findBySeriesId(seriesId: number, pagination: PaginationInput = {}): EpisodeConnection {
    return queryConnection<Episode>(
      this.db,
      'SELECT * FROM Episodes WHERE series_id = ?',
      [seriesId],
      'episode_id',
      'Episode',
      pagination
    )
  }

  findByCharacterId(characterId: number, pagination: PaginationInput = {}): EpisodeConnection {
    return queryConnection<Episode>(
      this.db,
      'SELECT e.* FROM Episodes e JOIN Character_Episodes ce ON ce.episode_id = e.episode_id WHERE ce.character_id = ?',
      [characterId],
      'episode_id',
      'Episode',
      pagination
    )
  }
}
