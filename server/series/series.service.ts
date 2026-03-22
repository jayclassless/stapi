import { queryConnection } from '../common/cursor.helper.js'
import { PaginationInput } from '../common/pagination.input.js'
import { DatabaseService } from '../database/database.service.js'
import { Series, SeriesConnection } from './series.model.js'

export class SeriesService {
  constructor(private readonly db: DatabaseService) {}

  findAll(pagination: PaginationInput = {}): SeriesConnection {
    return queryConnection<Series>(this.db.getAll('Series'), 'series_id', 'Series', pagination)
  }

  findById(id: number): Series | undefined {
    return this.db.getById('Series', id)
  }

  findByAbbreviation(abbreviation: string): Series | undefined {
    return this.db.getAll('Series').find((s) => s.abbreviation === abbreviation)
  }

  findByImdbId(imdbId: string): Series | undefined {
    return this.db.getAll('Series').find((s) => s.imdb_id === imdbId)
  }
}
