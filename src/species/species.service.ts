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
    let items = this.db.getAll('Species')
    if (filters.warpCapable != null)
      items = items.filter((s) => s.warp_capable === filters.warpCapable)
    return queryConnection<Species>(items, 'species_id', 'Species', pagination)
  }

  findById(id: number): Species | undefined {
    return this.db.getById('Species', id)
  }

  findByCharacterIds(characterIds: number[]): Species[] {
    if (characterIds.length === 0) return []
    return this.db.getByIds('Species', characterIds)
  }
}
