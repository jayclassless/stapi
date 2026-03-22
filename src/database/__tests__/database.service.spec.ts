import { join } from 'path'

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}))

import { readFileSync } from 'fs'

import { DatabaseService } from '../database.service'

const mockReadFileSync = vi.mocked(readFileSync)

function mockJsonFile(data: unknown) {
  return JSON.stringify(data)
}

describe('DatabaseService', () => {
  let service: DatabaseService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new DatabaseService()
  })

  describe('onModuleInit', () => {
    it('loads JSON files and builds collections', () => {
      const seriesData = [{ series_id: 1, name: 'TNG' }]
      mockReadFileSync.mockImplementation((path) => {
        if (String(path).includes('series.json')) return mockJsonFile(seriesData)
        return mockJsonFile([])
      })
      service.onModuleInit()
      expect(mockReadFileSync).toHaveBeenCalledWith(
        join(process.cwd(), 'data', 'series.json'),
        'utf-8'
      )
      expect(service.getAll('Series')).toEqual(seriesData)
    })
  })

  describe('getAll', () => {
    it('returns the full sorted array for a table', () => {
      const rows = [{ series_id: 1 }, { series_id: 2 }]
      mockReadFileSync.mockImplementation((path) => {
        if (String(path).includes('series.json')) return mockJsonFile(rows)
        return mockJsonFile([])
      })
      service.onModuleInit()
      expect(service.getAll('Series')).toEqual(rows)
    })
  })

  describe('getById', () => {
    it('returns a row by primary key', () => {
      const rows = [
        { series_id: 1, name: 'DS9' },
        { series_id: 2, name: 'TNG' },
      ]
      mockReadFileSync.mockImplementation((path) => {
        if (String(path).includes('series.json')) return mockJsonFile(rows)
        return mockJsonFile([])
      })
      service.onModuleInit()
      expect(service.getById('Series', 2)).toEqual({ series_id: 2, name: 'TNG' })
    })

    it('returns undefined when id not found', () => {
      mockReadFileSync.mockReturnValue(mockJsonFile([]))
      service.onModuleInit()
      expect(service.getById('Series', 999)).toBeUndefined()
    })
  })

  describe('getByIds', () => {
    it('returns rows matching the given ids in input order', () => {
      const rows = [
        { episode_id: 1, title: 'A' },
        { episode_id: 2, title: 'B' },
        { episode_id: 3, title: 'C' },
      ]
      mockReadFileSync.mockImplementation((path) => {
        if (String(path).includes('episodes.json')) return mockJsonFile(rows)
        return mockJsonFile([])
      })
      service.onModuleInit()
      const result = service.getByIds('Episodes', [3, 1])
      expect(result).toEqual([
        { episode_id: 3, title: 'C' },
        { episode_id: 1, title: 'A' },
      ])
    })

    it('omits ids that do not exist', () => {
      mockReadFileSync.mockReturnValue(mockJsonFile([]))
      service.onModuleInit()
      expect(service.getByIds('Episodes', [999])).toEqual([])
    })
  })

  describe('getRelatedIds', () => {
    it('returns related ids from a junction table', () => {
      const junctionData = [
        { char_episode_id: 1, character_id: 10, episode_id: 100 },
        { char_episode_id: 2, character_id: 10, episode_id: 200 },
        { char_episode_id: 3, character_id: 20, episode_id: 100 },
      ]
      mockReadFileSync.mockImplementation((path) => {
        if (String(path).includes('character_episodes.json')) return mockJsonFile(junctionData)
        return mockJsonFile([])
      })
      service.onModuleInit()
      const result = service.getRelatedIds('Character_Episodes', 'character_id', 10)
      expect(new Set(result)).toEqual(new Set([100, 200]))
    })

    it('returns empty array for unknown id', () => {
      mockReadFileSync.mockReturnValue(mockJsonFile([]))
      service.onModuleInit()
      expect(service.getRelatedIds('Character_Episodes', 'character_id', 999)).toEqual([])
    })

    it('indexes both foreign keys', () => {
      const junctionData = [{ char_episode_id: 1, character_id: 10, episode_id: 100 }]
      mockReadFileSync.mockImplementation((path) => {
        if (String(path).includes('character_episodes.json')) return mockJsonFile(junctionData)
        return mockJsonFile([])
      })
      service.onModuleInit()
      expect(service.getRelatedIds('Character_Episodes', 'episode_id', 100)).toEqual([10])
    })
  })

  describe('count', () => {
    it('returns the number of rows in a table', () => {
      const rows = [{ ship_id: 1 }, { ship_id: 2 }, { ship_id: 3 }]
      mockReadFileSync.mockImplementation((path) => {
        if (String(path).includes('ships.json')) return mockJsonFile(rows)
        return mockJsonFile([])
      })
      service.onModuleInit()
      expect(service.count('Ships')).toBe(3)
    })
  })
})
