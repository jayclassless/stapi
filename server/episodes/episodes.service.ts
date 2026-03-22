import { queryConnection } from '../common/cursor.helper.js'
import { PaginationInput } from '../common/pagination.input.js'
import { DatabaseService } from '../database/database.service.js'
import { Episode, EpisodeConnection } from './episode.model.js'

export class EpisodesService {
  constructor(private readonly db: DatabaseService) {}

  findAll(
    filters: { series?: number; season?: number } = {},
    pagination: PaginationInput = {}
  ): EpisodeConnection {
    let items = this.db.getAll('Episodes')
    if (filters.series != null) items = items.filter((e) => e.series_id === filters.series)
    if (filters.season != null) items = items.filter((e) => e.season === filters.season)
    return queryConnection<Episode>(items, 'episode_id', 'Episode', pagination)
  }

  findById(id: number): Episode | undefined {
    return this.db.getById('Episodes', id)
  }

  findByIds(ids: number[]): Episode[] {
    if (ids.length === 0) return []
    return this.db.getByIds('Episodes', ids)
  }

  findBySeriesId(
    seriesId: number,
    filters: { series?: number; season?: number } = {},
    pagination: PaginationInput = {}
  ): EpisodeConnection {
    let items = this.db.getAll('Episodes').filter((e) => e.series_id === seriesId)
    if (filters.series != null) items = items.filter((e) => e.series_id === filters.series)
    if (filters.season != null) items = items.filter((e) => e.season === filters.season)
    return queryConnection<Episode>(items, 'episode_id', 'Episode', pagination)
  }

  getRandomEpisode(): Episode | undefined {
    const all = this.db.getAll('Episodes')
    if (all.length === 0) return undefined
    return all[Math.floor(Math.random() * all.length)]
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
    const relatedIds = new Set(
      this.db.getRelatedIds('Character_Episodes', 'character_id', characterId)
    )
    let items = this.db.getAll('Episodes').filter((e) => relatedIds.has(e.episode_id))
    if (filters.series != null) items = items.filter((e) => e.series_id === filters.series)
    if (filters.season != null) items = items.filter((e) => e.season === filters.season)
    return queryConnection<Episode>(items, 'episode_id', 'Episode', pagination)
  }
}
