import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ShipsResolver } from '../ships.resolver'

function makeConnection() {
  return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 }
}

describe('ShipsResolver', () => {
  let mockShipsService: any
  let resolver: ShipsResolver

  beforeEach(() => {
    mockShipsService = {
      findAll: vi.fn().mockReturnValue(makeConnection()),
      findById: vi.fn().mockReturnValue(undefined),
    }
    resolver = new ShipsResolver(mockShipsService)
  })

  describe('findAll', () => {
    it('delegates to shipsService.findAll with pagination args', () => {
      resolver.findAll(10, undefined, undefined, undefined)
      expect(mockShipsService.findAll).toHaveBeenCalledWith({
        first: 10,
        last: undefined,
        before: undefined,
        after: undefined,
      })
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
