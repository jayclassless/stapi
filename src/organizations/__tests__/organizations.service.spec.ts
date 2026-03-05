import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service'
import { OrganizationsService } from '../organizations.service'

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

describe('OrganizationsService', () => {
  let mockDb: ReturnType<typeof makeMockDb>
  let service: OrganizationsService

  beforeEach(() => {
    mockDb = makeMockDb()
    service = new OrganizationsService(mockDb as Partial<DatabaseService> as DatabaseService)
  })

  describe('findAll', () => {
    it('returns a connection from Organizations table', () => {
      mockDb = makeMockDb(2, [{ organization_id: 1 }, { organization_id: 2 }])
      service = new OrganizationsService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.totalCount).toBe(2)
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('FROM Organizations')
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })

    it('filters by type', () => {
      mockDb = makeMockDb(1, [{ organization_id: 1 }])
      service = new OrganizationsService(mockDb as Partial<DatabaseService> as DatabaseService)
      service.findAll({ type: 'Military' }, {})
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('type = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual(['Military'])
    })
  })

  describe('findById', () => {
    it('queries by organization_id', () => {
      const row = { organization_id: 1, name: 'Starfleet', type: 'Military' }
      mockDb.queryOne.mockReturnValue(row)
      const result = service.findById(1)
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM Organizations WHERE organization_id = ?',
        [1]
      )
      expect(result).toEqual(row)
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })

  describe('findByCharacterId', () => {
    it('queries organizations via Character_Organizations join', () => {
      mockDb = makeMockDb(1, [{ organization_id: 1 }])
      service = new OrganizationsService(mockDb as Partial<DatabaseService> as DatabaseService)
      service.findByCharacterId(3, {}, {})
      const dataSql: string = mockDb.query.mock.calls[1][0]
      expect(dataSql).toContain('Character_Organizations')
      expect(dataSql).toContain('character_id = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([3])
    })

    it('applies type filter', () => {
      mockDb = makeMockDb(1, [{ organization_id: 1 }])
      service = new OrganizationsService(mockDb as Partial<DatabaseService> as DatabaseService)
      service.findByCharacterId(3, { type: 'Military' }, {})
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('type = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([3, 'Military'])
    })

    it('uses default pagination when not provided', () => {
      expect(service.findByCharacterId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })
})
