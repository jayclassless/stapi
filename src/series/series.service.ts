import { Injectable } from '@nestjs/common'

import { queryConnection } from '../common/cursor.helper'
import { PaginationInput } from '../common/pagination.input'
import { DatabaseService } from '../database/database.service'
import { Series, SeriesConnection } from './series.model'

@Injectable()
export class SeriesService {
  constructor(private readonly db: DatabaseService) {}

  findAll(pagination: PaginationInput = {}): SeriesConnection {
    return queryConnection<Series>(
      this.db,
      'SELECT * FROM Series',
      [],
      'series_id',
      'Series',
      pagination
    )
  }

  findById(id: number): Series | undefined {
    return this.db.queryOne<Series>('SELECT * FROM Series WHERE series_id = ?', [id])
  }

  findByAbbreviation(abbreviation: string): Series | undefined {
    return this.db.queryOne<Series>('SELECT * FROM Series WHERE abbreviation = ?', [abbreviation])
  }
}
