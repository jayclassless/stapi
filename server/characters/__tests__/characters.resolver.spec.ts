import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ActorsService } from '../../actors/actors.service.js'
import { EpisodesService } from '../../episodes/episodes.service.js'
import { OrganizationsService } from '../../organizations/organizations.service.js'
import { SpeciesService } from '../../species/species.service.js'
import { Character } from '../character.model.js'
import { CharactersResolver } from '../characters.resolver.js'
import { CharactersService } from '../characters.service.js'

function makeConnection() {
  return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 }
}

describe('CharactersResolver', () => {
  let mockCharactersService: {
    findAll: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
  }
  let mockSpeciesService: { findById: ReturnType<typeof vi.fn> }
  let mockActorsService: {
    findById: ReturnType<typeof vi.fn>
    findByCharacterId: ReturnType<typeof vi.fn>
  }
  let mockOrganizationsService: { findByCharacterId: ReturnType<typeof vi.fn> }
  let mockEpisodesService: { findByCharacterId: ReturnType<typeof vi.fn> }
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
      mockCharactersService as Partial<CharactersService> as CharactersService,
      mockSpeciesService as Partial<SpeciesService> as SpeciesService,
      mockActorsService as Partial<ActorsService> as ActorsService,
      mockOrganizationsService as Partial<OrganizationsService> as OrganizationsService,
      mockEpisodesService as Partial<EpisodesService> as EpisodesService
    )
  })

  describe('findAll', () => {
    it('delegates to charactersService.findAll with pagination args', () => {
      resolver.findAll(undefined, undefined, 10, undefined, undefined, undefined)
      expect(mockCharactersService.findAll).toHaveBeenCalledWith(
        { gender: undefined, primaryActor: undefined },
        { first: 10, last: undefined, before: undefined, after: undefined }
      )
    })

    it('passes gender filter to service', () => {
      resolver.findAll('Female', undefined, undefined, undefined, undefined, undefined)
      expect(mockCharactersService.findAll).toHaveBeenCalledWith(
        { gender: 'Female', primaryActor: undefined },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
    })

    it('passes primaryActor filter to service', () => {
      resolver.findAll(undefined, 3, undefined, undefined, undefined, undefined)
      expect(mockCharactersService.findAll).toHaveBeenCalledWith(
        { gender: undefined, primaryActor: 3 },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
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
      expect(resolver.species({ character_id: 1 } as Character)).toBeNull()
      expect(mockSpeciesService.findById).not.toHaveBeenCalled()
    })

    it('delegates to speciesService.findById when species_id present', () => {
      const speciesRow = { species_id: 5, name: 'Vulcan' }
      mockSpeciesService.findById.mockReturnValue(speciesRow)
      const result = resolver.species({ character_id: 1, species_id: 5 } as Character)
      expect(mockSpeciesService.findById).toHaveBeenCalledWith(5)
      expect(result).toBe(speciesRow)
    })
  })

  describe('primaryActor (ResolveField)', () => {
    it('returns null when character has no primary_actor_id', () => {
      expect(resolver.primaryActor({ character_id: 1 } as Character)).toBeNull()
      expect(mockActorsService.findById).not.toHaveBeenCalled()
    })

    it('delegates to actorsService.findById when primary_actor_id present', () => {
      const actorRow = { actor_id: 10, first_name: 'Patrick' }
      mockActorsService.findById.mockReturnValue(actorRow)
      const result = resolver.primaryActor({ character_id: 1, primary_actor_id: 10 } as Character)
      expect(mockActorsService.findById).toHaveBeenCalledWith(10)
      expect(result).toBe(actorRow)
    })
  })

  describe('actors (ResolveField)', () => {
    it('delegates to actorsService.findByCharacterId with character and pagination', () => {
      const character = { character_id: 3 } as Character
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
      const character = { character_id: 4 } as Character
      resolver.organizations(character, undefined, undefined, 3, undefined, undefined)
      expect(mockOrganizationsService.findByCharacterId).toHaveBeenCalledWith(
        4,
        { type: undefined },
        { first: undefined, last: 3, before: undefined, after: undefined }
      )
    })

    it('passes type filter to service', () => {
      const character = { character_id: 4 } as Character
      resolver.organizations(character, 'Military', undefined, undefined, undefined, undefined)
      expect(mockOrganizationsService.findByCharacterId).toHaveBeenCalledWith(
        4,
        { type: 'Military' },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
    })
  })

  describe('episodes (ResolveField)', () => {
    it('delegates to episodesService.findByCharacterId with character and pagination', () => {
      const character = { character_id: 7 } as Character
      resolver.episodes(character, undefined, undefined, undefined, undefined, 'cur1', 'cur2')
      expect(mockEpisodesService.findByCharacterId).toHaveBeenCalledWith(
        7,
        { series: undefined, season: undefined },
        { first: undefined, last: undefined, before: 'cur1', after: 'cur2' }
      )
    })

    it('passes season filter to service', () => {
      const character = { character_id: 7 } as Character
      resolver.episodes(character, undefined, 3, undefined, undefined, undefined, undefined)
      expect(mockEpisodesService.findByCharacterId).toHaveBeenCalledWith(
        7,
        { series: undefined, season: 3 },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
    })
  })
})
