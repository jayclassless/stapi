import { Injectable } from '@nestjs/common'

import { queryConnection } from '../common/cursor.helper'
import { PaginationInput } from '../common/pagination.input'
import { DatabaseService, SqlParam } from '../database/database.service'
import { Organization, OrganizationConnection } from './organization.model'

@Injectable()
export class OrganizationsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(
    filters: { type?: string } = {},
    pagination: PaginationInput = {}
  ): OrganizationConnection {
    const conditions: string[] = []
    const params: SqlParam[] = []
    if (filters.type != null) {
      conditions.push('type = ?')
      params.push(filters.type)
    }
    const whereSql = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
    return queryConnection<Organization>(
      this.db,
      `SELECT * FROM Organizations${whereSql}`,
      params,
      'organization_id',
      'Organization',
      pagination
    )
  }

  findById(id: number): Organization | undefined {
    return this.db.queryOne<Organization>('SELECT * FROM Organizations WHERE organization_id = ?', [
      id,
    ])
  }

  findByCharacterId(
    characterId: number,
    filters: { type?: string } = {},
    pagination: PaginationInput = {}
  ): OrganizationConnection {
    const params: SqlParam[] = [characterId]
    const andConds: string[] = []
    if (filters.type != null) {
      andConds.push('o.type = ?')
      params.push(filters.type)
    }
    const andSql = andConds.length ? ` AND ${andConds.join(' AND ')}` : ''
    return queryConnection<Organization>(
      this.db,
      `SELECT o.* FROM Organizations o JOIN Character_Organizations co ON co.organization_id = o.organization_id WHERE co.character_id = ?${andSql}`,
      params,
      'organization_id',
      'Organization',
      pagination
    )
  }
}
