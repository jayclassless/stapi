import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service'
import { SeriesService } from '../series.service'

function makeMockDb(rows: Record<string, unknown>[] = []) {
  return {
    getAll: vi.fn().mockReturnValue(rows),
    getById: vi.fn().mockReturnValue(undefined),
    getByIds: vi.fn().mockReturnValue([]),
    getRelatedIds: vi.fn().mockReturnValue([]),
    count: vi.fn().mockReturnValue(rows.length),
  }
}

describe('SeriesService', () => {
  let mockDb: ReturnType<typeof makeMockDb>
  let service: SeriesService

  beforeEach(() => {
    mockDb = makeMockDb()
    service = new SeriesService(mockDb as Partial<DatabaseService> as DatabaseService)
  })

  describe('findAll', () => {
    it('returns connection from getAll results', () => {
      mockDb = makeMockDb([{ series_id: 1 }, { series_id: 2 }])
      service = new SeriesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({})
      expect(result.totalCount).toBe(2)
      expect(result.edges).toHaveLength(2)
      expect(mockDb.getAll).toHaveBeenCalledWith('Series')
    })

    it('uses default empty pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], pageInfo: expect.any(Object), totalCount: 0 })
    })

    it('respects first pagination', () => {
      mockDb = makeMockDb([{ series_id: 1 }, { series_id: 2 }])
      service = new SeriesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({ first: 5 })
      expect(result.edges).toHaveLength(2)
    })
  })

  describe('findById', () => {
    it('looks up by series_id and returns the row', () => {
      const row = { series_id: 3, name: 'TNG' }
      mockDb.getById.mockReturnValue(row)
      const result = service.findById(3)
      expect(mockDb.getById).toHaveBeenCalledWith('Series', 3)
      expect(result).toEqual(row)
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })

  describe('findByAbbreviation', () => {
    it('finds by abbreviation in getAll results', () => {
      const rows = [
        { series_id: 1, abbreviation: 'DS9' },
        { series_id: 2, abbreviation: 'TNG' },
      ]
      mockDb = makeMockDb(rows)
      service = new SeriesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByAbbreviation('TNG')
      expect(result).toEqual(rows[1])
    })

    it('returns undefined when not found', () => {
      expect(service.findByAbbreviation('FAKE')).toBeUndefined()
    })
  })

  describe('findByImdbId', () => {
    it('finds by imdb_id in getAll results', () => {
      const rows = [{ series_id: 3, imdb_id: 'tt0092455' }]
      mockDb = makeMockDb(rows)
      service = new SeriesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByImdbId('tt0092455')
      expect(result).toEqual(rows[0])
    })

    it('returns undefined when not found', () => {
      expect(service.findByImdbId('tt9999999')).toBeUndefined()
    })
  })
})
