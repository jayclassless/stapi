import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CharactersService } from '../../characters/characters.service.js'
import { Species } from '../species.model.js'
import { SpeciesResolver } from '../species.resolver.js'
import { SpeciesService } from '../species.service.js'

function makeConnection() {
  return {
    edges: [] as never[],
    pageInfo: { hasNextPage: false, hasPreviousPage: false },
    totalCount: 0,
  }
}

describe('SpeciesResolver', () => {
  let mockSpeciesService: {
    findAll: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
  }
  let mockCharactersService: { findBySpeciesId: ReturnType<typeof vi.fn> }
  let resolver: SpeciesResolver

  beforeEach(() => {
    mockSpeciesService = {
      findAll: vi.fn().mockReturnValue(makeConnection()),
      findById: vi.fn().mockReturnValue(undefined),
    }
    mockCharactersService = {
      findBySpeciesId: vi.fn().mockReturnValue(makeConnection()),
    }
    resolver = new SpeciesResolver(
      mockSpeciesService as Partial<SpeciesService> as SpeciesService,
      mockCharactersService as Partial<CharactersService> as CharactersService
    )
  })

  describe('findAll', () => {
    it('delegates to speciesService.findAll with pagination args', () => {
      resolver.findAll(undefined, 10, undefined, undefined, undefined)
      expect(mockSpeciesService.findAll).toHaveBeenCalledWith(
        { warpCapable: undefined },
        { first: 10, last: undefined, before: undefined, after: undefined }
      )
    })

    it('passes warpCapable filter to service', () => {
      resolver.findAll(true, undefined, undefined, undefined, undefined)
      expect(mockSpeciesService.findAll).toHaveBeenCalledWith(
        { warpCapable: true },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
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
      const species = { species_id: 5 } as Species
      resolver.characters(species, undefined, undefined, 3, undefined, undefined, undefined)
      expect(mockCharactersService.findBySpeciesId).toHaveBeenCalledWith(
        5,
        { gender: undefined, primaryActor: undefined },
        { first: 3, last: undefined, before: undefined, after: undefined }
      )
    })

    it('passes gender filter to service', () => {
      const species = { species_id: 5 } as Species
      resolver.characters(species, 'M', undefined, undefined, undefined, undefined, undefined)
      expect(mockCharactersService.findBySpeciesId).toHaveBeenCalledWith(
        5,
        { gender: 'M', primaryActor: undefined },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockCharactersService.findBySpeciesId.mockReturnValue(conn)
      expect(resolver.characters({ species_id: 1 } as Species)).toBe(conn)
    })
  })
})
