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
 * Execute a cursor-paginated SQLite query.
 *
 * @param db        - object with .query<T>(sql, params) method
 * @param baseSql   - SELECT ... FROM Table [WHERE existing_conditions] — no ORDER BY / LIMIT
 * @param baseParams - params for the existing WHERE clause
 * @param pkCol     - primary key column name (used for cursor encoding and range filtering)
 * @param typeName  - name used in cursor encoding (e.g. "Series")
 * @param pagination - PaginationInput with first/last/after/before
 */
export function queryConnection<T extends Record<string, any>>(
  db: { query<R>(sql: string, params?: unknown[]): R[] },
  baseSql: string,
  baseParams: unknown[],
  pkCol: string,
  typeName: string,
  pagination: PaginationInput
): ConnectionResult<T> {
  const countSql = baseSql.replace(/^\s*SELECT\s+.+?\s+FROM\s+/is, 'SELECT COUNT(*) AS count FROM ')
  const [{ count }] = db.query<{ count: number }>(countSql, baseParams)

  const { first, last, after, before } = pagination ?? {}
  const extraConditions: string[] = []
  const params: unknown[] = [...baseParams]

  const afterId = after ? decodeCursor(after) : null
  const beforeId = before ? decodeCursor(before) : null

  if (afterId != null) {
    extraConditions.push(`${pkCol} > ?`)
    params.push(afterId)
  }
  if (beforeId != null) {
    extraConditions.push(`${pkCol} < ?`)
    params.push(beforeId)
  }

  const hasExistingWhere = /\bWHERE\b/i.test(baseSql)
  const whereJoin =
    extraConditions.length === 0
      ? ''
      : hasExistingWhere
        ? ` AND ${extraConditions.join(' AND ')}`
        : ` WHERE ${extraConditions.join(' AND ')}`

  if (last != null) {
    // Backward pagination: ORDER BY pk DESC LIMIT last+1, then reverse
    const sql = `${baseSql}${whereJoin} ORDER BY ${pkCol} DESC LIMIT ?`
    params.push(last + 1)
    const rows = db.query<T>(sql, params)
    const hasPreviousPage = rows.length > last
    if (hasPreviousPage) rows.pop()
    rows.reverse()
    const edges = rows.map((node) => ({
      cursor: encodeCursor(typeName, node[pkCol]),
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
      totalCount: count,
    }
  } else {
    // Forward pagination (default): ORDER BY pk ASC LIMIT first+1
    const limit = first ?? 20
    const sql = `${baseSql}${whereJoin} ORDER BY ${pkCol} ASC LIMIT ?`
    params.push(limit + 1)
    const rows = db.query<T>(sql, params)
    const hasNextPage = rows.length > limit
    if (hasNextPage) rows.pop()
    const edges = rows.map((node) => ({
      cursor: encodeCursor(typeName, node[pkCol]),
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
      totalCount: count,
    }
  }
}
