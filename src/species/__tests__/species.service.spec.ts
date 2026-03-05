import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service'
import { SpeciesService } from '../species.service'

describe('SpeciesService', () => {
  let service: SpeciesService

  function makeMockDb(totalCount = 0, rows: Record<string, unknown>[] = []) {
    return {
      query: vi
        .fn()
        .mockReturnValueOnce([{ count: totalCount }])
        .mockReturnValueOnce(rows),
      queryOne: vi.fn().mockReturnValue(undefined),
      count: vi.fn().mockReturnValue(0),
    }
  }

  beforeEach(() => {
    service = new SpeciesService(makeMockDb() as Partial<DatabaseService> as DatabaseService)
  })

  describe('findAll', () => {
    it('coerces warp_capable integer 1 to true', () => {
      const mockDb = makeMockDb(1, [{ species_id: 1, name: 'Vulcan', warp_capable: 1 }])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.edges[0].node.warp_capable).toBe(true)
    })

    it('coerces warp_capable integer 0 to false', () => {
      const mockDb = makeMockDb(1, [{ species_id: 2, name: 'Ferengi', warp_capable: 0 }])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.edges[0].node.warp_capable).toBe(false)
    })

    it('returns connection with correct totalCount', () => {
      const mockDb = makeMockDb(5, [{ species_id: 1, warp_capable: 1 }])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.totalCount).toBe(5)
    })

    it('uses default pagination when called with no args', () => {
      const mockDb = makeMockDb(0, [])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })

    it('filters by warpCapable=true (passes 1 to db)', () => {
      const mockDb = makeMockDb(1, [{ species_id: 1, warp_capable: 1 }])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      service.findAll({ warpCapable: true }, {})
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('warp_capable = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([1])
    })

    it('filters by warpCapable=false (passes 0 to db)', () => {
      const mockDb = makeMockDb(1, [{ species_id: 2, warp_capable: 0 }])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      service.findAll({ warpCapable: false }, {})
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('warp_capable = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([0])
    })
  })

  describe('findById', () => {
    it('coerces warp_capable for found row', () => {
      const mockDb = makeMockDb()
      mockDb.queryOne.mockReturnValue({ species_id: 1, name: 'Vulcan', warp_capable: 1 })
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findById(1)
      expect(result!.warp_capable).toBe(true)
    })

    it('coerces warp_capable 0 to false', () => {
      const mockDb = makeMockDb()
      mockDb.queryOne.mockReturnValue({ species_id: 2, name: 'Klingon', warp_capable: 0 })
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findById(2)
      expect(result!.warp_capable).toBe(false)
    })

    it('returns undefined when row not found', () => {
      const mockDb = makeMockDb()
      mockDb.queryOne.mockReturnValue(undefined)
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      expect(service.findById(999)).toBeUndefined()
    })

    it('queries by species_id', () => {
      const mockDb = makeMockDb()
      mockDb.queryOne.mockReturnValue({ species_id: 3, warp_capable: 1 })
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      service.findById(3)
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM Species WHERE species_id = ?',
        [3]
      )
    })
  })

  describe('findByCharacterIds', () => {
    it('returns empty array immediately for empty input without querying db', () => {
      const mockDb = makeMockDb()
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByCharacterIds([])
      expect(result).toEqual([])
      expect(mockDb.query).not.toHaveBeenCalled()
    })

    it('queries with IN clause for single id', () => {
      const mockDb = {
        query: vi.fn().mockReturnValue([{ species_id: 1, warp_capable: 1 }]),
        queryOne: vi.fn(),
      }
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      service.findByCharacterIds([5])
      const sql: string = mockDb.query.mock.calls[0][0]
      expect(sql).toContain('IN (?)')
      expect(mockDb.query.mock.calls[0][1]).toEqual([5])
    })

    it('queries with IN clause for multiple ids', () => {
      const mockDb = {
        query: vi.fn().mockReturnValue([
          { species_id: 1, warp_capable: 1 },
          { species_id: 2, warp_capable: 0 },
        ]),
        queryOne: vi.fn(),
      }
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByCharacterIds([3, 4])
      const sql: string = mockDb.query.mock.calls[0][0]
      expect(sql).toContain('IN (?,?)')
      expect(mockDb.query.mock.calls[0][1]).toEqual([3, 4])
      expect(result[0].warp_capable).toBe(true)
      expect(result[1].warp_capable).toBe(false)
    })

    it('coerces warp_capable on all returned rows', () => {
      const mockDb = {
        query: vi.fn().mockReturnValue([
          { species_id: 1, warp_capable: 1 },
          { species_id: 2, warp_capable: 0 },
          { species_id: 3, warp_capable: 1 },
        ]),
        queryOne: vi.fn(),
      }
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const results = service.findByCharacterIds([1, 2, 3])
      expect(results.map((r) => r.warp_capable)).toEqual([true, false, true])
    })
  })
})
