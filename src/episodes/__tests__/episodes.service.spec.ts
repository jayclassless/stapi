import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service'
import { EpisodesService } from '../episodes.service'

function makeMockDb(totalCount = 0, rows: any[] = []) {
  return {
    query: vi
      .fn()
      .mockReturnValueOnce([{ count: totalCount }])
      .mockReturnValueOnce(rows),
    queryOne: vi.fn().mockReturnValue(undefined),
  }
}

describe('EpisodesService', () => {
  let mockDb: ReturnType<typeof makeMockDb>
  let service: EpisodesService

  beforeEach(() => {
    mockDb = makeMockDb()
    service = new EpisodesService(mockDb as unknown as DatabaseService)
  })

  describe('findAll', () => {
    it('uses SELECT * FROM Episodes and returns connection', () => {
      mockDb = makeMockDb(1, [{ episode_id: 1 }])
      service = new EpisodesService(mockDb as unknown as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.totalCount).toBe(1)
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('FROM Episodes')
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })

    it('filters by series', () => {
      mockDb = makeMockDb(2, [{ episode_id: 1 }, { episode_id: 2 }])
      service = new EpisodesService(mockDb as unknown as DatabaseService)
      service.findAll({ series: 3 }, {})
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('series_id = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([3])
    })

    it('filters by season', () => {
      mockDb = makeMockDb(1, [{ episode_id: 5 }])
      service = new EpisodesService(mockDb as unknown as DatabaseService)
      service.findAll({ season: 2 }, {})
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('season = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([2])
    })

    it('combines series and season filters', () => {
      mockDb = makeMockDb(1, [{ episode_id: 6 }])
      service = new EpisodesService(mockDb as unknown as DatabaseService)
      service.findAll({ series: 1, season: 3 }, {})
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('series_id = ?')
      expect(countSql).toContain('season = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([1, 3])
    })
  })

  describe('findById', () => {
    it('queries by episode_id', () => {
      const row = { episode_id: 5, title: 'Encounter at Farpoint' }
      mockDb.queryOne.mockReturnValue(row)
      const result = service.findById(5)
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM Episodes WHERE episode_id = ?',
        [5]
      )
      expect(result).toEqual(row)
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })

  describe('findBySeriesId', () => {
    it('queries episodes for a series with WHERE clause', () => {
      mockDb = makeMockDb(3, [{ episode_id: 1 }, { episode_id: 2 }])
      service = new EpisodesService(mockDb as unknown as DatabaseService)
      const result = service.findBySeriesId(2, {}, {})
      expect(result.edges).toHaveLength(2)
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('FROM Episodes')
      expect(mockDb.query.mock.calls[0][1]).toEqual([2])
    })

    it('applies series filter', () => {
      mockDb = makeMockDb(1, [{ episode_id: 1 }])
      service = new EpisodesService(mockDb as unknown as DatabaseService)
      service.findBySeriesId(2, { series: 2 }, {})
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('series_id = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([2, 2])
    })

    it('applies season filter', () => {
      mockDb = makeMockDb(1, [{ episode_id: 1 }])
      service = new EpisodesService(mockDb as unknown as DatabaseService)
      service.findBySeriesId(2, { season: 3 }, {})
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('season = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([2, 3])
    })

    it('uses default pagination when not provided', () => {
      const result = service.findBySeriesId(1)
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findByCharacterId', () => {
    it('queries episodes via Character_Episodes join', () => {
      mockDb = makeMockDb(2, [{ episode_id: 10 }])
      service = new EpisodesService(mockDb as unknown as DatabaseService)
      const result = service.findByCharacterId(7, {}, {})
      expect(result.edges).toHaveLength(1)
      const dataSql: string = mockDb.query.mock.calls[1][0]
      expect(dataSql).toContain('Character_Episodes')
      expect(dataSql).toContain('character_id = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([7])
    })

    it('applies series filter', () => {
      mockDb = makeMockDb(1, [{ episode_id: 10 }])
      service = new EpisodesService(mockDb as unknown as DatabaseService)
      service.findByCharacterId(7, { series: 1 }, {})
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('series_id = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([7, 1])
    })

    it('applies season filter', () => {
      mockDb = makeMockDb(1, [{ episode_id: 10 }])
      service = new EpisodesService(mockDb as unknown as DatabaseService)
      service.findByCharacterId(7, { season: 2 }, {})
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('season = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([7, 2])
    })

    it('uses default pagination when not provided', () => {
      const result = service.findByCharacterId(1)
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })
  })
})
