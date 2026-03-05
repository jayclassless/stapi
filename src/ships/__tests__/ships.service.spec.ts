import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service'
import { ShipsService } from '../ships.service'

function makeMockDb(totalCount = 0, rows: any[] = []) {
  return {
    query: vi
      .fn()
      .mockReturnValueOnce([{ count: totalCount }])
      .mockReturnValueOnce(rows),
    queryOne: vi.fn().mockReturnValue(undefined),
  }
}

describe('ShipsService', () => {
  let mockDb: ReturnType<typeof makeMockDb>
  let service: ShipsService

  beforeEach(() => {
    mockDb = makeMockDb()
    service = new ShipsService(mockDb as unknown as DatabaseService)
  })

  describe('findAll', () => {
    it('returns a connection from Ships table', () => {
      mockDb = makeMockDb(3, [{ ship_id: 1 }, { ship_id: 2 }, { ship_id: 3 }])
      service = new ShipsService(mockDb as unknown as DatabaseService)
      const result = service.findAll({})
      expect(result.totalCount).toBe(3)
      expect(result.edges).toHaveLength(3)
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('FROM Ships')
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findById', () => {
    it('queries by ship_id and returns the row', () => {
      const row = { ship_id: 1, name: 'Enterprise', registry: 'NCC-1701' }
      mockDb.queryOne.mockReturnValue(row)
      const result = service.findById(1)
      expect(mockDb.queryOne).toHaveBeenCalledWith('SELECT * FROM Ships WHERE ship_id = ?', [1])
      expect(result).toEqual(row)
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })
})
