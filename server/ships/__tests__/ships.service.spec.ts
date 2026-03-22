import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service.js'
import { ShipsService } from '../ships.service.js'

function makeMockDb(rows: Record<string, unknown>[] = []) {
  return {
    getAll: vi.fn().mockReturnValue(rows),
    getById: vi.fn().mockReturnValue(undefined),
    getByIds: vi.fn().mockReturnValue([]),
    getRelatedIds: vi.fn().mockReturnValue([]),
    count: vi.fn().mockReturnValue(rows.length),
  }
}

describe('ShipsService', () => {
  let mockDb: ReturnType<typeof makeMockDb>
  let service: ShipsService

  beforeEach(() => {
    mockDb = makeMockDb()
    service = new ShipsService(mockDb as Partial<DatabaseService> as DatabaseService)
  })

  describe('findAll', () => {
    it('returns a connection from Ships table', () => {
      mockDb = makeMockDb([{ ship_id: 1 }, { ship_id: 2 }, { ship_id: 3 }])
      service = new ShipsService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.totalCount).toBe(3)
      expect(result.edges).toHaveLength(3)
      expect(mockDb.getAll).toHaveBeenCalledWith('Ships')
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })

    it('filters by status', () => {
      mockDb = makeMockDb([
        { ship_id: 1, status: 'Active' },
        { ship_id: 2, status: 'Destroyed' },
      ])
      service = new ShipsService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({ status: 'Active' }, {})
      expect(result.edges).toHaveLength(1)
      expect(result.edges[0].node).toEqual({ ship_id: 1, status: 'Active' })
    })
  })

  describe('findById', () => {
    it('looks up by ship_id and returns the row', () => {
      const row = { ship_id: 1, name: 'Enterprise', registry: 'NCC-1701' }
      mockDb.getById.mockReturnValue(row)
      const result = service.findById(1)
      expect(mockDb.getById).toHaveBeenCalledWith('Ships', 1)
      expect(result).toEqual(row)
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })
})
