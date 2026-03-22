import { GraphQLError } from 'graphql'
import { describe, expect, it } from 'vitest'

import { decodeCursor, encodeCursor, queryConnection } from '../cursor.helper.js'
import { PaginationInput } from '../pagination.input.js'

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

  it('throws GraphQLError for a cursor with no colon separator', () => {
    const bad = Buffer.from('nocursor').toString('base64')
    expect(() => decodeCursor(bad)).toThrow(GraphQLError)
  })

  it('throws GraphQLError for a cursor with a non-numeric id', () => {
    const bad = Buffer.from('Series:abc').toString('base64')
    expect(() => decodeCursor(bad)).toThrow(GraphQLError)
  })

  it('throws GraphQLError for a completely invalid base64 string', () => {
    expect(() => decodeCursor('not-a-valid-cursor!')).toThrow(GraphQLError)
  })
})

describe('queryConnection', () => {
  describe('forward path (no last)', () => {
    it('returns results with no pagination args using default limit of 20', () => {
      const items = Array.from({ length: 3 }, (_, i) => ({ series_id: i + 1 }))
      const result = queryConnection(items, 'series_id', 'Series', {})
      expect(result.totalCount).toBe(3)
      expect(result.edges).toHaveLength(3)
      expect(result.pageInfo.hasNextPage).toBe(false)
      expect(result.pageInfo.hasPreviousPage).toBe(false)
    })

    it('uses explicit first as limit', () => {
      const items = [{ series_id: 1 }, { series_id: 2 }]
      const result = queryConnection(items, 'series_id', 'Series', { first: 5 })
      expect(result.edges).toHaveLength(2)
      expect(result.pageInfo.hasNextPage).toBe(false)
    })

    it('sets hasNextPage true when items exceed first', () => {
      const items = [{ series_id: 1 }, { series_id: 2 }, { series_id: 3 }]
      const result = queryConnection(items, 'series_id', 'Series', { first: 2 })
      expect(result.pageInfo.hasNextPage).toBe(true)
      expect(result.edges).toHaveLength(2)
    })

    it('sets hasNextPage false when items equal first', () => {
      const items = [{ series_id: 1 }, { series_id: 2 }]
      const result = queryConnection(items, 'series_id', 'Series', { first: 2 })
      expect(result.pageInfo.hasNextPage).toBe(false)
      expect(result.edges).toHaveLength(2)
    })

    it('sets hasPreviousPage false when no after cursor', () => {
      const result = queryConnection([{ series_id: 1 }], 'series_id', 'Series', {})
      expect(result.pageInfo.hasPreviousPage).toBe(false)
    })

    it('sets hasPreviousPage true when after cursor is provided', () => {
      const after = encodeCursor('Series', 5)
      const items = [{ series_id: 4 }, { series_id: 5 }, { series_id: 6 }]
      const result = queryConnection(items, 'series_id', 'Series', { after })
      expect(result.pageInfo.hasPreviousPage).toBe(true)
      expect(result.edges).toHaveLength(1)
      expect(result.edges[0].node.series_id).toBe(6)
    })

    it('filters items after the after cursor', () => {
      const after = encodeCursor('Series', 5)
      const items = [{ series_id: 3 }, { series_id: 5 }, { series_id: 6 }, { series_id: 8 }]
      const result = queryConnection(items, 'series_id', 'Series', { after })
      expect(result.edges.map((e) => e.node.series_id)).toEqual([6, 8])
    })

    it('filters items before the before cursor', () => {
      const before = encodeCursor('Series', 10)
      const items = [{ series_id: 8 }, { series_id: 9 }, { series_id: 10 }, { series_id: 11 }]
      const result = queryConnection(items, 'series_id', 'Series', { before })
      expect(result.edges.map((e) => e.node.series_id)).toEqual([8, 9])
    })

    it('applies both after and before cursors', () => {
      const after = encodeCursor('Series', 3)
      const before = encodeCursor('Series', 9)
      const items = [
        { series_id: 1 },
        { series_id: 3 },
        { series_id: 5 },
        { series_id: 7 },
        { series_id: 9 },
        { series_id: 11 },
      ]
      const result = queryConnection(items, 'series_id', 'Series', { after, before })
      expect(result.edges.map((e) => e.node.series_id)).toEqual([5, 7])
    })

    it('returns null startCursor and endCursor for empty results', () => {
      const result = queryConnection([], 'series_id', 'Series', {})
      expect(result.pageInfo.startCursor).toBeNull()
      expect(result.pageInfo.endCursor).toBeNull()
      expect(result.edges).toHaveLength(0)
    })

    it('sets startCursor and endCursor from edges', () => {
      const items = [{ series_id: 1 }, { series_id: 2 }, { series_id: 3 }]
      const result = queryConnection(items, 'series_id', 'Series', {})
      expect(result.pageInfo.startCursor).toBe(encodeCursor('Series', 1))
      expect(result.pageInfo.endCursor).toBe(encodeCursor('Series', 3))
    })

    it('totalCount reflects the full array length', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({ series_id: i + 1 }))
      const result = queryConnection(items, 'series_id', 'Series', { first: 5 })
      expect(result.totalCount).toBe(50)
    })

    it('produces edge cursors with correct typeName and pk', () => {
      const items = [{ series_id: 7 }]
      const result = queryConnection(items, 'series_id', 'Series', {})
      expect(result.edges[0].cursor).toBe(encodeCursor('Series', 7))
      expect(result.edges[0].node).toEqual({ series_id: 7 })
    })

    it('handles null pagination via ?? fallback', () => {
      const result = queryConnection(
        [],
        'series_id',
        'Series',
        null as null | PaginationInput as PaginationInput
      )
      expect(result).toMatchObject({ edges: [], totalCount: 0 })
    })
  })

  describe('backward path (last != null)', () => {
    it('returns the last N items from the array', () => {
      const items = [{ series_id: 1 }, { series_id: 2 }, { series_id: 3 }]
      const result = queryConnection<{ series_id: number }>(items, 'series_id', 'Series', {
        last: 3,
      })
      expect(result.edges[0].node.series_id).toBe(1)
      expect(result.edges[1].node.series_id).toBe(2)
      expect(result.edges[2].node.series_id).toBe(3)
    })

    it('sets hasPreviousPage false when items equal last', () => {
      const items = [{ series_id: 2 }, { series_id: 3 }]
      const result = queryConnection(items, 'series_id', 'Series', { last: 2 })
      expect(result.pageInfo.hasPreviousPage).toBe(false)
      expect(result.edges).toHaveLength(2)
    })

    it('sets hasPreviousPage true when items exceed last', () => {
      const items = [{ series_id: 2 }, { series_id: 3 }, { series_id: 4 }]
      const result = queryConnection(items, 'series_id', 'Series', { last: 2 })
      expect(result.pageInfo.hasPreviousPage).toBe(true)
      expect(result.edges).toHaveLength(2)
      expect(result.edges[0].node.series_id).toBe(3)
    })

    it('sets hasNextPage false when no before cursor', () => {
      const result = queryConnection([{ series_id: 1 }], 'series_id', 'Series', { last: 1 })
      expect(result.pageInfo.hasNextPage).toBe(false)
    })

    it('sets hasNextPage true when before cursor is provided', () => {
      const before = encodeCursor('Series', 10)
      const items = [{ series_id: 8 }, { series_id: 9 }, { series_id: 10 }]
      const result = queryConnection(items, 'series_id', 'Series', { last: 1, before })
      expect(result.pageInfo.hasNextPage).toBe(true)
    })

    it('returns null startCursor and endCursor for empty backward results', () => {
      const result = queryConnection([], 'series_id', 'Series', { last: 5 })
      expect(result.pageInfo.startCursor).toBeNull()
      expect(result.pageInfo.endCursor).toBeNull()
    })

    it('sets startCursor and endCursor correctly', () => {
      const items = [{ series_id: 1 }, { series_id: 2 }, { series_id: 3 }]
      const result = queryConnection(items, 'series_id', 'Series', { last: 3 })
      expect(result.pageInfo.startCursor).toBe(encodeCursor('Series', 1))
      expect(result.pageInfo.endCursor).toBe(encodeCursor('Series', 3))
    })

    it('applies before cursor in backward pagination', () => {
      const before = encodeCursor('Series', 8)
      const items = [
        { series_id: 5 },
        { series_id: 6 },
        { series_id: 7 },
        { series_id: 8 },
        { series_id: 9 },
      ]
      const result = queryConnection(items, 'series_id', 'Series', { last: 1, before })
      expect(result.edges).toHaveLength(1)
      expect(result.edges[0].node.series_id).toBe(7)
    })
  })
})
