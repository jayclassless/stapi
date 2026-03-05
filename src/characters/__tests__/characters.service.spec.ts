import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service'
import { CharactersService } from '../characters.service'

function makeMockDb(totalCount = 0, rows: any[] = []) {
  return {
    query: vi
      .fn()
      .mockReturnValueOnce([{ count: totalCount }])
      .mockReturnValueOnce(rows),
    queryOne: vi.fn().mockReturnValue(undefined),
  }
}

describe('CharactersService', () => {
  let mockDb: ReturnType<typeof makeMockDb>
  let service: CharactersService

  beforeEach(() => {
    mockDb = makeMockDb()
    service = new CharactersService(mockDb as unknown as DatabaseService)
  })

  describe('findAll', () => {
    it('returns a connection from Characters table', () => {
      mockDb = makeMockDb(1, [{ character_id: 1 }])
      service = new CharactersService(mockDb as unknown as DatabaseService)
      const result = service.findAll({})
      expect(result.totalCount).toBe(1)
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('FROM Characters')
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findById', () => {
    it('queries by character_id', () => {
      const row = { character_id: 1, name: 'Picard' }
      mockDb.queryOne.mockReturnValue(row)
      expect(service.findById(1)).toEqual(row)
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM Characters WHERE character_id = ?',
        [1]
      )
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })

  describe('findByEpisodeId', () => {
    it('queries via Character_Episodes join', () => {
      mockDb = makeMockDb(1, [{ character_id: 5 }])
      service = new CharactersService(mockDb as unknown as DatabaseService)
      service.findByEpisodeId(10, {})
      const dataSql: string = mockDb.query.mock.calls[1][0]
      expect(dataSql).toContain('Character_Episodes')
      expect(dataSql).toContain('episode_id = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([10])
    })

    it('uses default pagination when not provided', () => {
      expect(service.findByEpisodeId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findBySpeciesId', () => {
    it('queries characters by species_id', () => {
      mockDb = makeMockDb(2, [{ character_id: 1 }, { character_id: 2 }])
      service = new CharactersService(mockDb as unknown as DatabaseService)
      service.findBySpeciesId(3, {})
      const dataSql: string = mockDb.query.mock.calls[1][0]
      expect(dataSql).toContain('species_id = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([3])
    })

    it('uses default pagination when not provided', () => {
      expect(service.findBySpeciesId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findByActorId', () => {
    it('queries via Character_Actors join', () => {
      mockDb = makeMockDb(1, [{ character_id: 2 }])
      service = new CharactersService(mockDb as unknown as DatabaseService)
      service.findByActorId(5, {})
      const dataSql: string = mockDb.query.mock.calls[1][0]
      expect(dataSql).toContain('Character_Actors')
      expect(dataSql).toContain('actor_id = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([5])
    })

    it('uses default pagination when not provided', () => {
      expect(service.findByActorId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findByOrganizationId', () => {
    it('queries via Character_Organizations join', () => {
      mockDb = makeMockDb(1, [{ character_id: 3 }])
      service = new CharactersService(mockDb as unknown as DatabaseService)
      service.findByOrganizationId(8, {})
      const dataSql: string = mockDb.query.mock.calls[1][0]
      expect(dataSql).toContain('Character_Organizations')
      expect(dataSql).toContain('organization_id = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([8])
    })

    it('uses default pagination when not provided', () => {
      expect(service.findByOrganizationId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })
})
