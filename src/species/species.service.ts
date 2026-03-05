import { Injectable } from '@nestjs/common'

import { queryConnection } from '../common/cursor.helper'
import { PaginationInput } from '../common/pagination.input'
import { DatabaseService } from '../database/database.service'
import { Species, SpeciesConnection } from './species.model'

@Injectable()
export class SpeciesService {
  constructor(private readonly db: DatabaseService) {}

  findAll(
    filters: { warpCapable?: boolean } = {},
    pagination: PaginationInput = {}
  ): SpeciesConnection {
    const conditions: string[] = []
    const params: unknown[] = []
    if (filters.warpCapable != null) {
      conditions.push('warp_capable = ?')
      params.push(filters.warpCapable ? 1 : 0)
    }
    const whereSql = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
    const result = queryConnection<Species>(
      this.db,
      `SELECT * FROM Species${whereSql}`,
      params,
      'species_id',
      'Species',
      pagination
    )
    return { ...result, edges: result.edges.map((e) => ({ ...e, node: this.coerce(e.node) })) }
  }

  findById(id: number): Species | undefined {
    const row = this.db.queryOne<Species>('SELECT * FROM Species WHERE species_id = ?', [id])
    return row ? this.coerce(row) : undefined
  }

  findByCharacterIds(characterIds: number[]): Species[] {
    if (characterIds.length === 0) return []
    const placeholders = characterIds.map(() => '?').join(',')
    return this.db
      .query<Species>(`SELECT * FROM Species WHERE species_id IN (${placeholders})`, characterIds)
      .map(this.coerce)
  }

  private coerce(row: Species): Species {
    return { ...row, warp_capable: Boolean((row as any).warp_capable) }
  }
}
