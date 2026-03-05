import { join } from 'path'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const mockAll = vi.fn().mockReturnValue([])
  const mockGet = vi.fn().mockReturnValue(undefined)
  const mockPrepare = vi.fn(function () {
    return { all: mockAll, get: mockGet }
  })
  const mockClose = vi.fn()
  const MockDatabase = vi.fn(function () {
    return { prepare: mockPrepare, close: mockClose }
  })
  return { MockDatabase, mockPrepare, mockAll, mockGet, mockClose }
})

vi.mock('better-sqlite3', () => ({ default: mocks.MockDatabase }))

import { DatabaseService } from '../database.service'

describe('DatabaseService', () => {
  let service: DatabaseService

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockAll.mockReturnValue([])
    mocks.mockGet.mockReturnValue(undefined)
    mocks.mockPrepare.mockImplementation(function () {
      return { all: mocks.mockAll, get: mocks.mockGet }
    })
    mocks.MockDatabase.mockImplementation(function () {
      return { prepare: mocks.mockPrepare, close: mocks.mockClose }
    })
    service = new DatabaseService()
  })

  describe('onModuleInit', () => {
    it('opens the database with the correct path and readonly option', () => {
      service.onModuleInit()
      expect(mocks.MockDatabase).toHaveBeenCalledWith(join(process.cwd(), 'startrek.db'), {
        readonly: true,
      })
    })
  })

  describe('onModuleDestroy', () => {
    it('closes the database after init', () => {
      service.onModuleInit()
      service.onModuleDestroy()
      expect(mocks.mockClose).toHaveBeenCalledOnce()
    })

    it('does not throw when called without prior init', () => {
      expect(() => service.onModuleDestroy()).not.toThrow()
    })
  })

  describe('query', () => {
    beforeEach(() => service.onModuleInit())

    it('prepares and executes the sql, returning all results', () => {
      const rows = [{ id: 1 }, { id: 2 }]
      mocks.mockAll.mockReturnValue(rows)
      const result = service.query('SELECT * FROM Series')
      expect(mocks.mockPrepare).toHaveBeenCalledWith('SELECT * FROM Series')
      expect(result).toEqual(rows)
    })

    it('spreads params into all()', () => {
      service.query('SELECT * FROM Series WHERE id = ?', [42])
      expect(mocks.mockAll).toHaveBeenCalledWith(42)
    })

    it('spreads multiple params', () => {
      service.query('SELECT 1 WHERE a = ? AND b = ?', [1, 'x'])
      expect(mocks.mockAll).toHaveBeenCalledWith(1, 'x')
    })

    it('calls all() with no args when params is empty', () => {
      service.query('SELECT 1')
      expect(mocks.mockAll).toHaveBeenCalledWith()
    })
  })

  describe('queryOne', () => {
    beforeEach(() => service.onModuleInit())

    it('prepares and executes, returning a single row', () => {
      mocks.mockGet.mockReturnValue({ id: 5 })
      const result = service.queryOne('SELECT * FROM Series WHERE id = ?', [5])
      expect(mocks.mockPrepare).toHaveBeenCalledWith('SELECT * FROM Series WHERE id = ?')
      expect(mocks.mockGet).toHaveBeenCalledWith(5)
      expect(result).toEqual({ id: 5 })
    })

    it('returns undefined when row not found', () => {
      mocks.mockGet.mockReturnValue(undefined)
      expect(service.queryOne('SELECT * FROM Series WHERE id = ?', [999])).toBeUndefined()
    })
  })

  describe('count', () => {
    beforeEach(() => service.onModuleInit())

    it('returns the count from the result row', () => {
      mocks.mockGet.mockReturnValue({ count: 7 })
      expect(service.count('SELECT COUNT(*) AS count FROM Series')).toBe(7)
    })

    it('returns 0 when row is undefined', () => {
      mocks.mockGet.mockReturnValue(undefined)
      expect(service.count('SELECT COUNT(*) AS count FROM Series')).toBe(0)
    })

    it('passes params to get()', () => {
      mocks.mockGet.mockReturnValue({ count: 3 })
      service.count('SELECT COUNT(*) AS count FROM Series WHERE id = ?', [1])
      expect(mocks.mockGet).toHaveBeenCalledWith(1)
    })
  })
})
