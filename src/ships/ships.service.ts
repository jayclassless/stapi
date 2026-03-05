import { Injectable } from '@nestjs/common'

import { queryConnection } from '../common/cursor.helper'
import { PaginationInput } from '../common/pagination.input'
import { DatabaseService, SqlParam } from '../database/database.service'
import { Ship, ShipConnection } from './ship.model'

@Injectable()
export class ShipsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(filters: { status?: string } = {}, pagination: PaginationInput = {}): ShipConnection {
    const conditions: string[] = []
    const params: SqlParam[] = []
    if (filters.status != null) {
      conditions.push('status = ?')
      params.push(filters.status)
    }
    const whereSql = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
    return queryConnection<Ship>(
      this.db,
      `SELECT * FROM Ships${whereSql}`,
      params,
      'ship_id',
      'Ship',
      pagination
    )
  }

  findById(id: number): Ship | undefined {
    return this.db.queryOne<Ship>('SELECT * FROM Ships WHERE ship_id = ?', [id])
  }
}
