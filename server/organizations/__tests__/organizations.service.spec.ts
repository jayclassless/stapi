import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service.js'
import { OrganizationsService } from '../organizations.service.js'

function makeMockDb(rows: Record<string, unknown>[] = []) {
  return {
    getAll: vi.fn().mockReturnValue(rows),
    getById: vi.fn().mockReturnValue(undefined),
    getByIds: vi.fn().mockReturnValue([]),
    getRelatedIds: vi.fn().mockReturnValue([]),
    count: vi.fn().mockReturnValue(rows.length),
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
      mockDb = makeMockDb([{ organization_id: 1 }, { organization_id: 2 }])
      service = new OrganizationsService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.totalCount).toBe(2)
      expect(mockDb.getAll).toHaveBeenCalledWith('Organizations')
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })

    it('filters by type', () => {
      mockDb = makeMockDb([
        { organization_id: 1, type: 'Military' },
        { organization_id: 2, type: 'Civilian' },
      ])
      service = new OrganizationsService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({ type: 'Military' }, {})
      expect(result.edges).toHaveLength(1)
    })
  })

  describe('findById', () => {
    it('looks up by organization_id', () => {
      const row = { organization_id: 1, name: 'Starfleet', type: 'Military' }
      mockDb.getById.mockReturnValue(row)
      const result = service.findById(1)
      expect(mockDb.getById).toHaveBeenCalledWith('Organizations', 1)
      expect(result).toEqual(row)
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })

  describe('findByCharacterId', () => {
    it('queries organizations via junction table', () => {
      mockDb = makeMockDb([{ organization_id: 1 }, { organization_id: 5 }])
      mockDb.getRelatedIds.mockReturnValue([1])
      service = new OrganizationsService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByCharacterId(3, {}, {})
      expect(mockDb.getRelatedIds).toHaveBeenCalledWith(
        'Character_Organizations',
        'character_id',
        3
      )
      expect(result.edges).toHaveLength(1)
      expect(result.edges[0].node).toEqual({ organization_id: 1 })
    })

    it('applies type filter', () => {
      mockDb = makeMockDb([
        { organization_id: 1, type: 'Military' },
        { organization_id: 2, type: 'Civilian' },
      ])
      mockDb.getRelatedIds.mockReturnValue([1, 2])
      service = new OrganizationsService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByCharacterId(3, { type: 'Military' }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('uses default pagination when not provided', () => {
      expect(service.findByCharacterId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })
})
