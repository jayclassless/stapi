import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CharactersResolver } from '../characters.resolver'

function makeConnection() {
  return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 }
}

describe('CharactersResolver', () => {
  let mockCharactersService: any
  let mockSpeciesService: any
  let mockActorsService: any
  let mockOrganizationsService: any
  let mockEpisodesService: any
  let resolver: CharactersResolver

  beforeEach(() => {
    mockCharactersService = {
      findAll: vi.fn().mockReturnValue(makeConnection()),
      findById: vi.fn().mockReturnValue(undefined),
    }
    mockSpeciesService = {
      findById: vi.fn().mockReturnValue(undefined),
    }
    mockActorsService = {
      findById: vi.fn().mockReturnValue(undefined),
      findByCharacterId: vi.fn().mockReturnValue(makeConnection()),
    }
    mockOrganizationsService = {
      findByCharacterId: vi.fn().mockReturnValue(makeConnection()),
    }
    mockEpisodesService = {
      findByCharacterId: vi.fn().mockReturnValue(makeConnection()),
    }
    resolver = new CharactersResolver(
      mockCharactersService,
      mockSpeciesService,
      mockActorsService,
      mockOrganizationsService,
      mockEpisodesService
    )
  })

  describe('findAll', () => {
    it('delegates to charactersService.findAll with pagination args', () => {
      resolver.findAll(10, undefined, undefined, undefined)
      expect(mockCharactersService.findAll).toHaveBeenCalledWith({
        first: 10,
        last: undefined,
        before: undefined,
        after: undefined,
      })
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockCharactersService.findAll.mockReturnValue(conn)
      expect(resolver.findAll()).toBe(conn)
    })
  })

  describe('findById', () => {
    it('delegates to charactersService.findById', () => {
      const row = { character_id: 1, name: 'Picard' }
      mockCharactersService.findById.mockReturnValue(row)
      expect(resolver.findById(1)).toBe(row)
      expect(mockCharactersService.findById).toHaveBeenCalledWith(1)
    })
  })

  describe('species (ResolveField)', () => {
    it('returns null when character has no species_id', () => {
      expect(resolver.species({ character_id: 1 } as any)).toBeNull()
      expect(mockSpeciesService.findById).not.toHaveBeenCalled()
    })

    it('delegates to speciesService.findById when species_id present', () => {
      const speciesRow = { species_id: 5, name: 'Vulcan' }
      mockSpeciesService.findById.mockReturnValue(speciesRow)
      const result = resolver.species({ character_id: 1, species_id: 5 } as any)
      expect(mockSpeciesService.findById).toHaveBeenCalledWith(5)
      expect(result).toBe(speciesRow)
    })
  })

  describe('primaryActor (ResolveField)', () => {
    it('returns null when character has no primary_actor_id', () => {
      expect(resolver.primaryActor({ character_id: 1 } as any)).toBeNull()
      expect(mockActorsService.findById).not.toHaveBeenCalled()
    })

    it('delegates to actorsService.findById when primary_actor_id present', () => {
      const actorRow = { actor_id: 10, first_name: 'Patrick' }
      mockActorsService.findById.mockReturnValue(actorRow)
      const result = resolver.primaryActor({ character_id: 1, primary_actor_id: 10 } as any)
      expect(mockActorsService.findById).toHaveBeenCalledWith(10)
      expect(result).toBe(actorRow)
    })
  })

  describe('actors (ResolveField)', () => {
    it('delegates to actorsService.findByCharacterId with character and pagination', () => {
      const character = { character_id: 3 } as any
      resolver.actors(character, 5, undefined, undefined, undefined)
      expect(mockActorsService.findByCharacterId).toHaveBeenCalledWith(3, {
        first: 5,
        last: undefined,
        before: undefined,
        after: undefined,
      })
    })
  })

  describe('organizations (ResolveField)', () => {
    it('delegates to organizationsService.findByCharacterId with character and pagination', () => {
      const character = { character_id: 4 } as any
      resolver.organizations(character, undefined, 3, undefined, undefined)
      expect(mockOrganizationsService.findByCharacterId).toHaveBeenCalledWith(4, {
        first: undefined,
        last: 3,
        before: undefined,
        after: undefined,
      })
    })
  })

  describe('episodes (ResolveField)', () => {
    it('delegates to episodesService.findByCharacterId with character and pagination', () => {
      const character = { character_id: 7 } as any
      resolver.episodes(character, undefined, undefined, 'cur1', 'cur2')
      expect(mockEpisodesService.findByCharacterId).toHaveBeenCalledWith(7, {
        first: undefined,
        last: undefined,
        before: 'cur1',
        after: 'cur2',
      })
    })
  })
})
