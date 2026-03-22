import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service'
import { ActorsService } from '../actors.service'

function makeMockDb(rows: Record<string, unknown>[] = []) {
  return {
    getAll: vi.fn().mockReturnValue(rows),
    getById: vi.fn().mockReturnValue(undefined),
    getByIds: vi.fn().mockReturnValue([]),
    getRelatedIds: vi.fn().mockReturnValue([]),
    count: vi.fn().mockReturnValue(rows.length),
  }
}

describe('ActorsService', () => {
  let mockDb: ReturnType<typeof makeMockDb>
  let service: ActorsService

  beforeEach(() => {
    mockDb = makeMockDb()
    service = new ActorsService(mockDb as Partial<DatabaseService> as DatabaseService)
  })

  describe('findAll', () => {
    it('returns a connection from Actors table', () => {
      mockDb = makeMockDb([{ actor_id: 1 }, { actor_id: 2 }])
      service = new ActorsService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({})
      expect(result.totalCount).toBe(2)
      expect(result.edges).toHaveLength(2)
      expect(mockDb.getAll).toHaveBeenCalledWith('Actors')
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findById', () => {
    it('looks up by actor_id', () => {
      const row = { actor_id: 3, first_name: 'Patrick', last_name: 'Stewart' }
      mockDb.getById.mockReturnValue(row)
      const result = service.findById(3)
      expect(mockDb.getById).toHaveBeenCalledWith('Actors', 3)
      expect(result).toEqual(row)
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })

  describe('findByCharacterId', () => {
    it('queries actors via Character_Actors junction', () => {
      mockDb = makeMockDb([{ actor_id: 10 }, { actor_id: 20 }])
      mockDb.getRelatedIds.mockReturnValue([10])
      service = new ActorsService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findByCharacterId(4, {})
      expect(mockDb.getRelatedIds).toHaveBeenCalledWith('Character_Actors', 'character_id', 4)
      expect(result.edges).toHaveLength(1)
    })

    it('uses default pagination when not provided', () => {
      expect(service.findByCharacterId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })
})
