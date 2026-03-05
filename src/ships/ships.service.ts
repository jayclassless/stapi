import { Injectable } from '@nestjs/common'

import { queryConnection } from '../common/cursor.helper'
import { PaginationInput } from '../common/pagination.input'
import { DatabaseService } from '../database/database.service'
import { Ship, ShipConnection } from './ship.model'

@Injectable()
export class ShipsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(pagination: PaginationInput = {}): ShipConnection {
    return queryConnection<Ship>(this.db, 'SELECT * FROM Ships', [], 'ship_id', 'Ship', pagination)
  }

  findById(id: number): Ship | undefined {
    return this.db.queryOne<Ship>('SELECT * FROM Ships WHERE ship_id = ?', [id])
  }
}
