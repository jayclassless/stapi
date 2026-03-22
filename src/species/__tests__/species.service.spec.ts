import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service'
import { SpeciesService } from '../species.service'

function makeMockDb(rows: Record<string, unknown>[] = []) {
  return {
    getAll: vi.fn().mockReturnValue(rows),
    getById: vi.fn().mockReturnValue(undefined),
    getByIds: vi.fn().mockReturnValue([]),
    getRelatedIds: vi.fn().mockReturnValue([]),
    count: vi.fn().mockReturnValue(rows.length),
  }
}

describe('SpeciesService', () => {
  let service: SpeciesService

  beforeEach(() => {
    service = new SpeciesService(makeMockDb() as Partial<DatabaseService> as DatabaseService)
  })

  describe('findAll', () => {
    it('returns warp_capable as boolean true', () => {
      const mockDb = makeMockDb([{ species_id: 1, name: 'Vulcan', warp_capable: true }])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.edges[0].node.warp_capable).toBe(true)
    })

    it('returns warp_capable as boolean false', () => {
      const mockDb = makeMockDb([{ species_id: 2, name: 'Ferengi', warp_capable: false }])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.edges[0].node.warp_capable).toBe(false)
    })

    it('returns connection with correct totalCount', () => {
      const mockDb = makeMockDb([
        { species_id: 1, warp_capable: true },
        { species_id: 2, warp_capable: false },
      ])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.totalCount).toBe(2)
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })

    it('filters by warpCapable=true', () => {
      const mockDb = makeMockDb([
        { species_id: 1, warp_capable: true },
        { species_id: 2, warp_capable: false },
      ])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({ warpCapable: true }, {})
      expect(result.edges).toHaveLength(1)
      expect(result.edges[0].node.warp_capable).toBe(true)
    })

    it('filters by warpCapable=false', () => {
      const mockDb = makeMockDb([
        { species_id: 1, warp_capable: true },
        { species_id: 2, warp_capable: false },
      ])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({ warpCapable: false }, {})
      expect(result.edges).toHaveLength(1)
      expect(result.edges[0].node.warp_capable).toBe(false)
    })
  })

  describe('findById', () => {
    it('returns the row from getById', () => {
      const mockDb = makeMockDb()
      mockDb.getById.mockReturnValue({ species_id: 1, name: 'Vulcan', warp_capable: true })
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findById(1)
      expect(result!.warp_capable).toBe(true)
      expect(mockDb.getById).toHaveBeenCalledWith('Species', 1)
    })

    it('returns undefined when row not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })

  describe('findByCharacterIds', () => {
    it('returns empty array immediately for empty input', () => {
      const mockDb = makeMockDb()
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByCharacterIds([])
      expect(result).toEqual([])
      expect(mockDb.getByIds).not.toHaveBeenCalled()
    })

    it('calls getByIds with species ids', () => {
      const mockDb = makeMockDb()
      mockDb.getByIds.mockReturnValue([
        { species_id: 1, warp_capable: true },
        { species_id: 2, warp_capable: false },
      ])
      service = new SpeciesService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByCharacterIds([1, 2])
      expect(mockDb.getByIds).toHaveBeenCalledWith('Species', [1, 2])
      expect(result).toHaveLength(2)
    })
  })
})
