import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service.js'
import { EpisodesService } from '../episodes.service.js'

function makeMockDb(rows: Record<string, unknown>[] = []) {
  return {
    getAll: vi.fn().mockReturnValue(rows),
    getById: vi.fn().mockReturnValue(undefined),
    getByIds: vi.fn().mockReturnValue([]),
    getRelatedIds: vi.fn().mockReturnValue([]),
    count: vi.fn().mockReturnValue(rows.length),
  }
}

describe('EpisodesService', () => {
  let mockDb: ReturnType<typeof makeMockDb>
  let service: EpisodesService

  beforeEach(() => {
    mockDb = makeMockDb()
    service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)
  })

  describe('findAll', () => {
    it('returns connection from Episodes', () => {
      mockDb = makeMockDb([{ episode_id: 1 }])
      service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.totalCount).toBe(1)
      expect(mockDb.getAll).toHaveBeenCalledWith('Episodes')
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })

    it('filters by series', () => {
      mockDb = makeMockDb([
        { episode_id: 1, series_id: 3 },
        { episode_id: 2, series_id: 5 },
      ])
      service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({ series: 3 }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('filters by season', () => {
      mockDb = makeMockDb([
        { episode_id: 1, season: 2 },
        { episode_id: 2, season: 3 },
      ])
      service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({ season: 2 }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('combines series and season filters', () => {
      mockDb = makeMockDb([
        { episode_id: 1, series_id: 1, season: 3 },
        { episode_id: 2, series_id: 1, season: 4 },
        { episode_id: 3, series_id: 2, season: 3 },
      ])
      service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({ series: 1, season: 3 }, {})
      expect(result.edges).toHaveLength(1)
    })
  })

  describe('findById', () => {
    it('looks up by episode_id', () => {
      const row = { episode_id: 5, title: 'Encounter at Farpoint' }
      mockDb.getById.mockReturnValue(row)
      const result = service.findById(5)
      expect(mockDb.getById).toHaveBeenCalledWith('Episodes', 5)
      expect(result).toEqual(row)
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })

  describe('findByIds', () => {
    it('returns [] for an empty ids array without querying', () => {
      expect(service.findByIds([])).toEqual([])
      expect(mockDb.getByIds).not.toHaveBeenCalled()
    })

    it('calls getByIds with the episode ids', () => {
      mockDb.getByIds.mockReturnValue([])
      service.findByIds([1, 2])
      expect(mockDb.getByIds).toHaveBeenCalledWith('Episodes', [1, 2])
    })

    it('preserves the input order of ids', () => {
      mockDb.getByIds.mockReturnValue([
        { episode_id: 2, title: 'B' },
        { episode_id: 1, title: 'A' },
      ])
      const result = service.findByIds([2, 1])
      expect(result[0].episode_id).toBe(2)
      expect(result[1].episode_id).toBe(1)
    })

    it('omits ids whose episodes are not found', () => {
      mockDb.getByIds.mockReturnValue([{ episode_id: 3, title: 'C' }])
      const result = service.findByIds([3, 999])
      expect(result).toHaveLength(1)
      expect(result[0].episode_id).toBe(3)
    })
  })

  describe('findBySeriesId', () => {
    it('filters episodes by series_id', () => {
      mockDb = makeMockDb([
        { episode_id: 1, series_id: 2 },
        { episode_id: 2, series_id: 3 },
      ])
      service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findBySeriesId(2, {}, {})
      expect(result.edges).toHaveLength(1)
    })

    it('applies season filter', () => {
      mockDb = makeMockDb([
        { episode_id: 1, series_id: 2, season: 1 },
        { episode_id: 2, series_id: 2, season: 3 },
      ])
      service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findBySeriesId(2, { season: 3 }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('uses default pagination when not provided', () => {
      const result = service.findBySeriesId(1)
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findByCharacterId', () => {
    it('queries episodes via junction table', () => {
      mockDb = makeMockDb([{ episode_id: 10 }, { episode_id: 20 }])
      mockDb.getRelatedIds.mockReturnValue([10])
      service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByCharacterId(7, {}, {})
      expect(mockDb.getRelatedIds).toHaveBeenCalledWith('Character_Episodes', 'character_id', 7)
      expect(result.edges).toHaveLength(1)
    })

    it('applies series filter', () => {
      mockDb = makeMockDb([
        { episode_id: 10, series_id: 1 },
        { episode_id: 20, series_id: 2 },
      ])
      mockDb.getRelatedIds.mockReturnValue([10, 20])
      service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByCharacterId(7, { series: 1 }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('applies season filter', () => {
      mockDb = makeMockDb([
        { episode_id: 10, season: 1 },
        { episode_id: 20, season: 2 },
      ])
      mockDb.getRelatedIds.mockReturnValue([10, 20])
      service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByCharacterId(7, { season: 2 }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('uses default pagination when not provided', () => {
      const result = service.findByCharacterId(1)
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('getRandomEpisode', () => {
    it('returns undefined when there are no episodes', () => {
      expect(service.getRandomEpisode()).toBeUndefined()
    })

    it('returns a random episode from the collection', () => {
      const episodes = [
        { episode_id: 1, title: 'A' },
        { episode_id: 2, title: 'B' },
      ]
      mockDb = makeMockDb(episodes)
      service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.getRandomEpisode()
      expect(episodes).toContainEqual(result)
    })
  })

  describe('randomEpisodeStream', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('yields count episodes separated by 3s and then completes', async () => {
      vi.useFakeTimers()
      const episodes = [{ episode_id: 1, title: 'Pilot' }]
      mockDb = makeMockDb(episodes)
      service = new EpisodesService(mockDb as Partial<DatabaseService> as DatabaseService)

      const gen = service.randomEpisodeStream(2)

      const p1 = gen.next()
      await vi.advanceTimersByTimeAsync(3000)
      const r1 = await p1
      expect(r1.done).toBe(false)
      expect(r1.value).toEqual(episodes[0])

      const p2 = gen.next()
      await vi.advanceTimersByTimeAsync(3000)
      const r2 = await p2
      expect(r2.done).toBe(false)
      expect(r2.value).toEqual(episodes[0])

      const r3 = await gen.next()
      expect(r3.done).toBe(true)
    })

    it('skips yield when getRandomEpisode returns undefined', async () => {
      vi.useFakeTimers()
      const gen = service.randomEpisodeStream(1)
      const p1 = gen.next()
      await vi.advanceTimersByTimeAsync(3000)
      const r1 = await p1
      expect(r1.done).toBe(true)
    })
  })
})
