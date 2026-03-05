import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SpeciesResolver } from '../species.resolver'

function makeConnection() {
  return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 }
}

describe('SpeciesResolver', () => {
  let mockSpeciesService: any
  let mockCharactersService: any
  let resolver: SpeciesResolver

  beforeEach(() => {
    mockSpeciesService = {
      findAll: vi.fn().mockReturnValue(makeConnection()),
      findById: vi.fn().mockReturnValue(undefined),
    }
    mockCharactersService = {
      findBySpeciesId: vi.fn().mockReturnValue(makeConnection()),
    }
    resolver = new SpeciesResolver(mockSpeciesService, mockCharactersService)
  })

  describe('findAll', () => {
    it('delegates to speciesService.findAll with pagination args', () => {
      resolver.findAll(10, undefined, undefined, undefined)
      expect(mockSpeciesService.findAll).toHaveBeenCalledWith({
        first: 10,
        last: undefined,
        before: undefined,
        after: undefined,
      })
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockSpeciesService.findAll.mockReturnValue(conn)
      expect(resolver.findAll()).toBe(conn)
    })
  })

  describe('findById', () => {
    it('delegates to speciesService.findById', () => {
      const row = { species_id: 1, name: 'Vulcan', warp_capable: true }
      mockSpeciesService.findById.mockReturnValue(row)
      expect(resolver.findById(1)).toBe(row)
      expect(mockSpeciesService.findById).toHaveBeenCalledWith(1)
    })

    it('returns undefined when not found', () => {
      expect(resolver.findById(999)).toBeUndefined()
    })
  })

  describe('characters (ResolveField)', () => {
    it('delegates to charactersService.findBySpeciesId with species and pagination', () => {
      const species = { species_id: 5 } as any
      resolver.characters(species, 3, undefined, undefined, undefined)
      expect(mockCharactersService.findBySpeciesId).toHaveBeenCalledWith(5, {
        first: 3,
        last: undefined,
        before: undefined,
        after: undefined,
      })
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockCharactersService.findBySpeciesId.mockReturnValue(conn)
      expect(resolver.characters({ species_id: 1 } as any)).toBe(conn)
    })
  })
})
