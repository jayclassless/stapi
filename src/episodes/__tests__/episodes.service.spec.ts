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
      const result = service.findAll({})
      expect(result.totalCount).toBe(1)
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('FROM Episodes')
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
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
      const result = service.findBySeriesId(2, {})
      expect(result.edges).toHaveLength(2)
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('FROM Episodes')
      // baseParams passed to COUNT
      const countParams: unknown[] = mockDb.query.mock.calls[0][1]
      expect(countParams).toEqual([2])
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
      const result = service.findByCharacterId(7, {})
      expect(result.edges).toHaveLength(1)
      const dataSql: string = mockDb.query.mock.calls[1][0]
      expect(dataSql).toContain('Character_Episodes')
      expect(dataSql).toContain('character_id = ?')
      const countParams: unknown[] = mockDb.query.mock.calls[0][1]
      expect(countParams).toEqual([7])
    })

    it('uses default pagination when not provided', () => {
      const result = service.findByCharacterId(1)
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })
  })
})
