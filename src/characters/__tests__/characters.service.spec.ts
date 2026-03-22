import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service'
import { CharactersService } from '../characters.service'

function makeMockDb(rows: Record<string, unknown>[] = []) {
  return {
    getAll: vi.fn().mockReturnValue(rows),
    getById: vi.fn().mockReturnValue(undefined),
    getByIds: vi.fn().mockReturnValue([]),
    getRelatedIds: vi.fn().mockReturnValue([]),
    count: vi.fn().mockReturnValue(rows.length),
  }
}

describe('CharactersService', () => {
  let mockDb: ReturnType<typeof makeMockDb>
  let service: CharactersService

  beforeEach(() => {
    mockDb = makeMockDb()
    service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
  })

  describe('findAll', () => {
    it('returns a connection from Characters table', () => {
      mockDb = makeMockDb([{ character_id: 1 }])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({}, {})
      expect(result.totalCount).toBe(1)
      expect(mockDb.getAll).toHaveBeenCalledWith('Characters')
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })

    it('filters by gender', () => {
      mockDb = makeMockDb([
        { character_id: 1, gender: 'Female' },
        { character_id: 2, gender: 'Male' },
      ])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({ gender: 'Female' }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('filters by primaryActor', () => {
      mockDb = makeMockDb([
        { character_id: 1, primary_actor_id: 5 },
        { character_id: 2, primary_actor_id: 7 },
      ])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({ primaryActor: 5 }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('combines multiple filters', () => {
      mockDb = makeMockDb([
        { character_id: 1, gender: 'Male', primary_actor_id: 7 },
        { character_id: 2, gender: 'Male', primary_actor_id: 8 },
        { character_id: 3, gender: 'Female', primary_actor_id: 7 },
      ])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({ gender: 'Male', primaryActor: 7 }, {})
      expect(result.edges).toHaveLength(1)
    })
  })

  describe('findById', () => {
    it('looks up by character_id', () => {
      const row = { character_id: 1, name: 'Picard' }
      mockDb.getById.mockReturnValue(row)
      expect(service.findById(1)).toEqual(row)
      expect(mockDb.getById).toHaveBeenCalledWith('Characters', 1)
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })

  describe('findByEpisodeId', () => {
    it('queries via Character_Episodes junction', () => {
      mockDb = makeMockDb([{ character_id: 5 }, { character_id: 10 }])
      mockDb.getRelatedIds.mockReturnValue([5])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByEpisodeId(10, {}, {})
      expect(mockDb.getRelatedIds).toHaveBeenCalledWith('Character_Episodes', 'episode_id', 10)
      expect(result.edges).toHaveLength(1)
    })

    it('applies gender filter', () => {
      mockDb = makeMockDb([
        { character_id: 5, gender: 'F' },
        { character_id: 6, gender: 'M' },
      ])
      mockDb.getRelatedIds.mockReturnValue([5, 6])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByEpisodeId(10, { gender: 'F' }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('applies primaryActor filter', () => {
      mockDb = makeMockDb([
        { character_id: 5, primary_actor_id: 3 },
        { character_id: 6, primary_actor_id: 4 },
      ])
      mockDb.getRelatedIds.mockReturnValue([5, 6])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByEpisodeId(10, { primaryActor: 3 }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('uses default pagination when not provided', () => {
      expect(service.findByEpisodeId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findBySpeciesId', () => {
    it('filters characters by species_id', () => {
      mockDb = makeMockDb([
        { character_id: 1, species_id: 3 },
        { character_id: 2, species_id: 5 },
      ])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findBySpeciesId(3, {}, {})
      expect(result.edges).toHaveLength(1)
    })

    it('applies gender filter', () => {
      mockDb = makeMockDb([
        { character_id: 1, species_id: 3, gender: 'M' },
        { character_id: 2, species_id: 3, gender: 'F' },
      ])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findBySpeciesId(3, { gender: 'M' }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('applies primaryActor filter', () => {
      mockDb = makeMockDb([
        { character_id: 1, species_id: 3, primary_actor_id: 9 },
        { character_id: 2, species_id: 3, primary_actor_id: 10 },
      ])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findBySpeciesId(3, { primaryActor: 9 }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('uses default pagination when not provided', () => {
      expect(service.findBySpeciesId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findByActorId', () => {
    it('queries via Character_Actors junction', () => {
      mockDb = makeMockDb([{ character_id: 2 }, { character_id: 4 }])
      mockDb.getRelatedIds.mockReturnValue([2])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByActorId(5, {}, {})
      expect(mockDb.getRelatedIds).toHaveBeenCalledWith('Character_Actors', 'actor_id', 5)
      expect(result.edges).toHaveLength(1)
    })

    it('applies gender filter', () => {
      mockDb = makeMockDb([
        { character_id: 2, gender: 'F' },
        { character_id: 3, gender: 'M' },
      ])
      mockDb.getRelatedIds.mockReturnValue([2, 3])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByActorId(5, { gender: 'F' }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('applies primaryActor filter', () => {
      mockDb = makeMockDb([
        { character_id: 2, primary_actor_id: 7 },
        { character_id: 3, primary_actor_id: 8 },
      ])
      mockDb.getRelatedIds.mockReturnValue([2, 3])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByActorId(5, { primaryActor: 7 }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('uses default pagination when not provided', () => {
      expect(service.findByActorId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findByOrganizationId', () => {
    it('queries via Character_Organizations junction', () => {
      mockDb = makeMockDb([{ character_id: 3 }, { character_id: 5 }])
      mockDb.getRelatedIds.mockReturnValue([3])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByOrganizationId(8, {}, {})
      expect(mockDb.getRelatedIds).toHaveBeenCalledWith(
        'Character_Organizations',
        'organization_id',
        8
      )
      expect(result.edges).toHaveLength(1)
    })

    it('applies gender filter', () => {
      mockDb = makeMockDb([
        { character_id: 3, gender: 'F' },
        { character_id: 4, gender: 'M' },
      ])
      mockDb.getRelatedIds.mockReturnValue([3, 4])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByOrganizationId(8, { gender: 'F' }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('applies primaryActor filter', () => {
      mockDb = makeMockDb([
        { character_id: 3, primary_actor_id: 2 },
        { character_id: 4, primary_actor_id: 3 },
      ])
      mockDb.getRelatedIds.mockReturnValue([3, 4])
      service = new CharactersService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByOrganizationId(8, { primaryActor: 2 }, {})
      expect(result.edges).toHaveLength(1)
    })

    it('uses default pagination when not provided', () => {
      expect(service.findByOrganizationId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })
})
