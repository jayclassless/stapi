import { queryConnection } from '../common/cursor.helper.js'
import { PaginationInput } from '../common/pagination.input.js'
import { DatabaseService } from '../database/database.service.js'
import { Ship, ShipConnection } from './ship.model.js'

export class ShipsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(filters: { status?: string } = {}, pagination: PaginationInput = {}): ShipConnection {
    let items = this.db.getAll('Ships')
    if (filters.status != null) items = items.filter((s) => s.status === filters.status)
    return queryConnection<Ship>(items, 'ship_id', 'Ship', pagination)
  }

  findById(id: number): Ship | undefined {
    return this.db.getById('Ships', id)
  }
}
