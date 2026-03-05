import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service'
import { SeriesService } from '../series.service'

function makeMockDb(totalCount = 0, rows: any[] = []) {
  return {
    query: vi
      .fn()
      .mockReturnValueOnce([{ count: totalCount }])
      .mockReturnValueOnce(rows),
    queryOne: vi.fn().mockReturnValue(undefined),
  }
}

describe('SeriesService', () => {
  let mockDb: ReturnType<typeof makeMockDb>
  let service: SeriesService

  beforeEach(() => {
    mockDb = makeMockDb()
    service = new SeriesService(mockDb as unknown as DatabaseService)
  })

  describe('findAll', () => {
    it('calls queryConnection with correct sql and returns connection', () => {
      mockDb = makeMockDb(2, [{ series_id: 1 }, { series_id: 2 }])
      service = new SeriesService(mockDb as unknown as DatabaseService)
      const result = service.findAll({})
      expect(result.totalCount).toBe(2)
      expect(result.edges).toHaveLength(2)
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('COUNT(*)')
      expect(countSql).toContain('FROM Series')
    })

    it('uses default empty pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], pageInfo: expect.any(Object), totalCount: 0 })
    })

    it('respects first pagination', () => {
      mockDb = makeMockDb(10, [{ series_id: 1 }, { series_id: 2 }])
      service = new SeriesService(mockDb as unknown as DatabaseService)
      const result = service.findAll({ first: 5 })
      expect(result.edges).toHaveLength(2)
    })
  })

  describe('findById', () => {
    it('queries by series_id and returns the row', () => {
      const row = { series_id: 3, name: 'TNG' }
      mockDb.queryOne.mockReturnValue(row)
      const result = service.findById(3)
      expect(mockDb.queryOne).toHaveBeenCalledWith('SELECT * FROM Series WHERE series_id = ?', [3])
      expect(result).toEqual(row)
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })

  describe('findByAbbreviation', () => {
    it('queries by abbreviation and returns the row', () => {
      const row = { series_id: 2, abbreviation: 'TNG' }
      mockDb.queryOne.mockReturnValue(row)
      const result = service.findByAbbreviation('TNG')
      expect(mockDb.queryOne).toHaveBeenCalledWith('SELECT * FROM Series WHERE abbreviation = ?', [
        'TNG',
      ])
      expect(result).toEqual(row)
    })

    it('returns undefined when not found', () => {
      expect(service.findByAbbreviation('FAKE')).toBeUndefined()
    })
  })
})
