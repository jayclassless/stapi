import { UserInputError } from '@nestjs/apollo'

import { PageInfo } from './page-info.type'
import { PaginationInput } from './pagination.input'

export function encodeCursor(typeName: string, id: number): string {
  return Buffer.from(`${typeName}:${id}`).toString('base64')
}

export function decodeCursor(cursor: string): number {
  const decoded = Buffer.from(cursor, 'base64').toString('utf8')
  const id = parseInt(decoded.split(':')[1], 10)
  if (!Number.isFinite(id)) {
    throw new UserInputError(`Invalid cursor: "${cursor}"`)
  }
  return id
}

export interface ConnectionResult<T> {
  edges: Array<{ cursor: string; node: T }>
  pageInfo: PageInfo
  totalCount: number
}

/**
 * Paginate a pre-filtered, PK-sorted array using cursor-based pagination.
 *
 * @param items      - array of rows, sorted by pkCol ascending
 * @param pkCol      - primary key property name on each row
 * @param typeName   - name used in cursor encoding (e.g. "Series")
 * @param pagination - PaginationInput with first/last/after/before
 */
export function queryConnection<T extends object>(
  items: T[],
  pkCol: string,
  typeName: string,
  pagination: PaginationInput
): ConnectionResult<T> {
  const totalCount = items.length
  const { first, last, after, before } = pagination ?? {}

  const afterId = after ? decodeCursor(after) : null
  const beforeId = before ? decodeCursor(before) : null

  // Apply cursor bounds
  let start = 0
  let end = items.length
  if (afterId != null) {
    start = items.findIndex(
      (item) => ((item as Record<string, unknown>)[pkCol] as number) > afterId
    )
    if (start === -1) start = items.length
  }
  if (beforeId != null) {
    const idx = items.findIndex(
      (item) => ((item as Record<string, unknown>)[pkCol] as number) >= beforeId
    )
    end = idx === -1 ? items.length : idx
  }

  const window = items.slice(start, end)

  if (last != null) {
    const hasPreviousPage = window.length > last
    const sliced = hasPreviousPage ? window.slice(window.length - last) : window
    const edges = sliced.map((node) => ({
      cursor: encodeCursor(typeName, (node as Record<string, unknown>)[pkCol] as number),
      node,
    }))
    return {
      edges,
      pageInfo: {
        hasNextPage: beforeId != null,
        hasPreviousPage,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
      totalCount,
    }
  } else {
    const limit = first ?? 20
    const hasNextPage = window.length > limit
    const sliced = hasNextPage ? window.slice(0, limit) : window
    const edges = sliced.map((node) => ({
      cursor: encodeCursor(typeName, (node as Record<string, unknown>)[pkCol] as number),
      node,
    }))
    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: afterId != null,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
      totalCount,
    }
  }
}
