import { UserInputError } from '@nestjs/apollo'
import { describe, expect, it, vi } from 'vitest'

import { decodeCursor, encodeCursor, queryConnection } from '../cursor.helper'

function makeDb(totalCount: number, rows: any[]) {
  return {
    query: vi
      .fn()
      .mockReturnValueOnce([{ count: totalCount }])
      .mockReturnValueOnce(rows),
  }
}

describe('encodeCursor', () => {
  it('encodes typeName:id as base64', () => {
    expect(encodeCursor('Series', 1)).toBe(Buffer.from('Series:1').toString('base64'))
  })

  it('encodes different type names distinctly', () => {
    expect(encodeCursor('Episode', 1)).not.toBe(encodeCursor('Series', 1))
  })

  it('handles id 0', () => {
    expect(encodeCursor('X', 0)).toBe(Buffer.from('X:0').toString('base64'))
  })

  it('handles large ids', () => {
    expect(encodeCursor('X', 999999)).toBe(Buffer.from('X:999999').toString('base64'))
  })
})

describe('decodeCursor', () => {
  it('round-trips with encodeCursor', () => {
    expect(decodeCursor(encodeCursor('Series', 42))).toBe(42)
  })

  it('returns a number', () => {
    expect(typeof decodeCursor(encodeCursor('Series', 5))).toBe('number')
  })

  it('decodes different ids correctly', () => {
    expect(decodeCursor(encodeCursor('Episode', 100))).toBe(100)
  })

  it('throws UserInputError for a cursor with no colon separator', () => {
    const bad = Buffer.from('nocursor').toString('base64')
    expect(() => decodeCursor(bad)).toThrow(UserInputError)
  })

  it('throws UserInputError for a cursor with a non-numeric id', () => {
    const bad = Buffer.from('Series:abc').toString('base64')
    expect(() => decodeCursor(bad)).toThrow(UserInputError)
  })

  it('throws UserInputError for a completely invalid base64 string', () => {
    expect(() => decodeCursor('not-a-valid-cursor!')).toThrow(UserInputError)
  })
})

describe('queryConnection', () => {
  describe('forward path (no last)', () => {
    it('returns results with no pagination args using default limit of 20', () => {
      const rows = Array.from({ length: 3 }, (_, i) => ({ series_id: i + 1 }))
      const db = makeDb(3, rows)
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {})
      expect(result.totalCount).toBe(3)
      expect(result.edges).toHaveLength(3)
      expect(result.pageInfo.hasNextPage).toBe(false)
      expect(result.pageInfo.hasPreviousPage).toBe(false)
      // LIMIT should be 21 (default 20 + 1)
      const dataSql: string = db.query.mock.calls[1][0]
      expect(dataSql).toContain('LIMIT ?')
      expect(dataSql).toContain('ORDER BY series_id ASC')
      const dataParams: unknown[] = db.query.mock.calls[1][1]
      expect(dataParams[dataParams.length - 1]).toBe(21)
    })

    it('uses explicit first as limit', () => {
      const rows = [{ series_id: 1 }, { series_id: 2 }]
      const db = makeDb(10, rows)
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {
        first: 5,
      })
      expect(result.edges).toHaveLength(2)
      expect(result.pageInfo.hasNextPage).toBe(false)
      const dataParams: unknown[] = db.query.mock.calls[1][1]
      expect(dataParams[dataParams.length - 1]).toBe(6) // first + 1
    })

    it('sets hasNextPage true when rows exceed first', () => {
      const rows = [{ series_id: 1 }, { series_id: 2 }, { series_id: 3 }] // 3 rows for first=2
      const db = makeDb(10, rows)
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {
        first: 2,
      })
      expect(result.pageInfo.hasNextPage).toBe(true)
      expect(result.edges).toHaveLength(2) // extra row popped
    })

    it('sets hasNextPage false when rows equal first', () => {
      const rows = [{ series_id: 1 }, { series_id: 2 }]
      const db = makeDb(10, rows)
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {
        first: 2,
      })
      expect(result.pageInfo.hasNextPage).toBe(false)
      expect(result.edges).toHaveLength(2)
    })

    it('sets hasPreviousPage false when no after cursor', () => {
      const db = makeDb(1, [{ series_id: 1 }])
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {})
      expect(result.pageInfo.hasPreviousPage).toBe(false)
    })

    it('sets hasPreviousPage true when after cursor is provided', () => {
      const after = encodeCursor('Series', 5)
      const db = makeDb(10, [{ series_id: 6 }])
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {
        after,
      })
      expect(result.pageInfo.hasPreviousPage).toBe(true)
    })

    it('appends WHERE pk > afterId when no existing WHERE', () => {
      const after = encodeCursor('Series', 5)
      const db = makeDb(10, [{ series_id: 6 }])
      queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', { after })
      const dataSql: string = db.query.mock.calls[1][0]
      expect(dataSql).toContain('WHERE series_id > ?')
      const dataParams: unknown[] = db.query.mock.calls[1][1]
      expect(dataParams).toContain(5)
    })

    it('appends AND pk > afterId when existing WHERE clause present', () => {
      const after = encodeCursor('Episode', 3)
      const db = makeDb(10, [{ episode_id: 4 }])
      queryConnection(
        db,
        'SELECT * FROM Episodes WHERE series_id = ?',
        [1],
        'episode_id',
        'Episode',
        { after }
      )
      const dataSql: string = db.query.mock.calls[1][0]
      expect(dataSql).toContain('AND episode_id > ?')
      expect(dataSql).not.toContain('WHERE episode_id')
    })

    it('appends pk < beforeId condition', () => {
      const before = encodeCursor('Series', 10)
      const db = makeDb(10, [{ series_id: 9 }])
      queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', { before })
      const dataSql: string = db.query.mock.calls[1][0]
      expect(dataSql).toContain('WHERE series_id < ?')
    })

    it('appends both after and before conditions', () => {
      const after = encodeCursor('Series', 3)
      const before = encodeCursor('Series', 9)
      const db = makeDb(10, [{ series_id: 5 }])
      queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', { after, before })
      const dataSql: string = db.query.mock.calls[1][0]
      expect(dataSql).toContain('series_id > ?')
      expect(dataSql).toContain('series_id < ?')
    })

    it('returns null startCursor and endCursor for empty results', () => {
      const db = makeDb(0, [])
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {})
      expect(result.pageInfo.startCursor).toBeNull()
      expect(result.pageInfo.endCursor).toBeNull()
      expect(result.edges).toHaveLength(0)
    })

    it('sets startCursor and endCursor from edges', () => {
      const rows = [{ series_id: 1 }, { series_id: 2 }, { series_id: 3 }]
      const db = makeDb(3, rows)
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {})
      expect(result.pageInfo.startCursor).toBe(encodeCursor('Series', 1))
      expect(result.pageInfo.endCursor).toBe(encodeCursor('Series', 3))
    })

    it('passes baseParams to COUNT query', () => {
      const db = makeDb(5, [{ episode_id: 1 }])
      queryConnection(
        db,
        'SELECT * FROM Episodes WHERE series_id = ?',
        [42],
        'episode_id',
        'Episode',
        {}
      )
      const countParams: unknown[] = db.query.mock.calls[0][1]
      expect(countParams).toEqual([42])
    })

    it('wraps base query in subquery for count', () => {
      const db = makeDb(0, [])
      queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {})
      const countSql: string = db.query.mock.calls[0][0]
      expect(countSql).toBe('SELECT COUNT(*) AS count FROM (SELECT * FROM Series) _sub')
    })

    it('wraps joined query in subquery for count', () => {
      const db = makeDb(0, [])
      const baseSql =
        'SELECT e.* FROM Episodes e JOIN Character_Episodes ce ON ce.episode_id = e.episode_id WHERE ce.character_id = ?'
      queryConnection(db, baseSql, [1], 'episode_id', 'Episode', {})
      const countSql: string = db.query.mock.calls[0][0]
      expect(countSql).toBe(`SELECT COUNT(*) AS count FROM (${baseSql}) _sub`)
    })

    it('produces edge cursors with correct typeName and pk', () => {
      const rows = [{ series_id: 7 }]
      const db = makeDb(1, rows)
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {})
      expect(result.edges[0].cursor).toBe(encodeCursor('Series', 7))
      expect(result.edges[0].node).toEqual({ series_id: 7 })
    })

    it('handles null pagination via ?? fallback', () => {
      const db = makeDb(0, [])
      const result = queryConnection(
        db,
        'SELECT * FROM Series',
        [],
        'series_id',
        'Series',
        null as any
      )
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })

    it('case-insensitive WHERE detection', () => {
      const after = encodeCursor('Series', 1)
      const db = makeDb(1, [{ series_id: 2 }])
      queryConnection(db, 'SELECT * FROM Series where active = 1', [], 'series_id', 'Series', {
        after,
      })
      const dataSql: string = db.query.mock.calls[1][0]
      expect(dataSql).toContain('AND series_id > ?')
    })
  })

  describe('backward path (last != null)', () => {
    it('uses ORDER BY DESC and reverses results', () => {
      const rows = [{ series_id: 3 }, { series_id: 2 }, { series_id: 1 }]
      const db = makeDb(3, rows)
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {
        last: 3,
      })
      expect(result.edges[0].node.series_id).toBe(1)
      expect(result.edges[1].node.series_id).toBe(2)
      expect(result.edges[2].node.series_id).toBe(3)
      const dataSql: string = db.query.mock.calls[1][0]
      expect(dataSql).toContain('ORDER BY series_id DESC')
    })

    it('sets hasPreviousPage false when rows equal last', () => {
      const rows = [{ series_id: 3 }, { series_id: 2 }]
      const db = makeDb(3, rows)
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {
        last: 2,
      })
      expect(result.pageInfo.hasPreviousPage).toBe(false)
      expect(result.edges).toHaveLength(2)
    })

    it('sets hasPreviousPage true when rows exceed last', () => {
      const rows = [{ series_id: 4 }, { series_id: 3 }, { series_id: 2 }] // 3 for last=2
      const db = makeDb(4, rows)
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {
        last: 2,
      })
      expect(result.pageInfo.hasPreviousPage).toBe(true)
      expect(result.edges).toHaveLength(2) // extra row popped before reverse
    })

    it('sets hasNextPage false when no before cursor', () => {
      const db = makeDb(3, [{ series_id: 1 }])
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {
        last: 1,
      })
      expect(result.pageInfo.hasNextPage).toBe(false)
    })

    it('sets hasNextPage true when before cursor is provided', () => {
      const before = encodeCursor('Series', 10)
      const db = makeDb(10, [{ series_id: 9 }])
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {
        last: 1,
        before,
      })
      expect(result.pageInfo.hasNextPage).toBe(true)
    })

    it('returns null startCursor and endCursor for empty backward results', () => {
      const db = makeDb(0, [])
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {
        last: 5,
      })
      expect(result.pageInfo.startCursor).toBeNull()
      expect(result.pageInfo.endCursor).toBeNull()
    })

    it('sets startCursor and endCursor after reversal', () => {
      const rows = [{ series_id: 3 }, { series_id: 2 }, { series_id: 1 }]
      const db = makeDb(3, rows)
      const result = queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', {
        last: 3,
      })
      // After reversal: [1, 2, 3]
      expect(result.pageInfo.startCursor).toBe(encodeCursor('Series', 1))
      expect(result.pageInfo.endCursor).toBe(encodeCursor('Series', 3))
    })

    it('uses LIMIT last+1', () => {
      const db = makeDb(10, [{ series_id: 5 }])
      queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', { last: 4 })
      const dataParams: unknown[] = db.query.mock.calls[1][1]
      expect(dataParams[dataParams.length - 1]).toBe(5) // last + 1
    })

    it('applies before cursor as pk < beforeId', () => {
      const before = encodeCursor('Series', 8)
      const db = makeDb(5, [{ series_id: 7 }])
      queryConnection(db, 'SELECT * FROM Series', [], 'series_id', 'Series', { last: 1, before })
      const dataSql: string = db.query.mock.calls[1][0]
      expect(dataSql).toContain('WHERE series_id < ?')
    })
  })
})
