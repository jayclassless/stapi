import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseService } from '../../database/database.service'
import { ActorsService } from '../actors.service'

function makeMockDb(totalCount = 0, rows: Record<string, unknown>[] = []) {
  return {
    query: vi
      .fn()
      .mockReturnValueOnce([{ count: totalCount }])
      .mockReturnValueOnce(rows),
    queryOne: vi.fn().mockReturnValue(undefined),
    count: vi.fn().mockReturnValue(0),
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
      mockDb = makeMockDb(2, [{ actor_id: 1 }, { actor_id: 2 }])
      service = new ActorsService(mockDb as Partial<DatabaseService> as DatabaseService)
      const result = service.findAll({})
      expect(result.totalCount).toBe(2)
      expect(result.edges).toHaveLength(2)
      const countSql: string = mockDb.query.mock.calls[0][0]
      expect(countSql).toContain('FROM Actors')
    })

    it('uses default pagination when called with no args', () => {
      const result = service.findAll()
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('findById', () => {
    it('queries by actor_id', () => {
      const row = { actor_id: 3, first_name: 'Patrick', last_name: 'Stewart' }
      mockDb.queryOne.mockReturnValue(row)
      const result = service.findById(3)
      expect(mockDb.queryOne).toHaveBeenCalledWith('SELECT * FROM Actors WHERE actor_id = ?', [3])
      expect(result).toEqual(row)
    })

    it('returns undefined when not found', () => {
      expect(service.findById(999)).toBeUndefined()
    })
  })

  describe('findByCharacterId', () => {
    it('queries actors via Character_Actors join', () => {
      mockDb = makeMockDb(1, [{ actor_id: 10 }])
      service = new ActorsService(mockDb as Partial<DatabaseService> as DatabaseService)
      service.findByCharacterId(4, {})
      const dataSql: string = mockDb.query.mock.calls[1][0]
      expect(dataSql).toContain('Character_Actors')
      expect(dataSql).toContain('character_id = ?')
      expect(mockDb.query.mock.calls[0][1]).toEqual([4])
    })

    it('uses default pagination when not provided', () => {
      expect(service.findByCharacterId(1)).toMatchObject({ edges: [], totalCount: 0 })
    })
  })
})
