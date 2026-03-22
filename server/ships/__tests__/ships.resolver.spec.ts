import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ShipsResolver } from '../ships.resolver.js'
import { ShipsService } from '../ships.service.js'

function makeConnection() {
  return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 }
}

describe('ShipsResolver', () => {
  let mockShipsService: {
    findAll: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
  }
  let resolver: ShipsResolver

  beforeEach(() => {
    mockShipsService = {
      findAll: vi.fn().mockReturnValue(makeConnection()),
      findById: vi.fn().mockReturnValue(undefined),
    }
    resolver = new ShipsResolver(mockShipsService as Partial<ShipsService> as ShipsService)
  })

  describe('findAll', () => {
    it('delegates to shipsService.findAll with pagination args', () => {
      resolver.findAll(undefined, 10, undefined, undefined, undefined)
      expect(mockShipsService.findAll).toHaveBeenCalledWith(
        { status: undefined },
        { first: 10, last: undefined, before: undefined, after: undefined }
      )
    })

    it('passes status filter to service', () => {
      resolver.findAll('Active', undefined, undefined, undefined, undefined)
      expect(mockShipsService.findAll).toHaveBeenCalledWith(
        { status: 'Active' },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockShipsService.findAll.mockReturnValue(conn)
      expect(resolver.findAll()).toBe(conn)
    })
  })

  describe('findById', () => {
    it('delegates to shipsService.findById', () => {
      const row = { ship_id: 1, name: 'Enterprise', registry: 'NCC-1701' }
      mockShipsService.findById.mockReturnValue(row)
      expect(resolver.findById(1)).toBe(row)
      expect(mockShipsService.findById).toHaveBeenCalledWith(1)
    })

    it('returns undefined when not found', () => {
      expect(resolver.findById(999)).toBeUndefined()
    })
  })
})
