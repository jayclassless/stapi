import { queryConnection } from '../common/cursor.helper.js'
import { PaginationInput } from '../common/pagination.input.js'
import { DatabaseService } from '../database/database.service.js'
import { Organization, OrganizationConnection } from './organization.model.js'

export class OrganizationsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(
    filters: { type?: string } = {},
    pagination: PaginationInput = {}
  ): OrganizationConnection {
    let items = this.db.getAll('Organizations')
    if (filters.type != null) items = items.filter((o) => o.type === filters.type)
    return queryConnection<Organization>(items, 'organization_id', 'Organization', pagination)
  }

  findById(id: number): Organization | undefined {
    return this.db.getById('Organizations', id)
  }

  findByCharacterId(
    characterId: number,
    filters: { type?: string } = {},
    pagination: PaginationInput = {}
  ): OrganizationConnection {
    const relatedIds = new Set(
      this.db.getRelatedIds('Character_Organizations', 'character_id', characterId)
    )
    let items = this.db.getAll('Organizations').filter((o) => relatedIds.has(o.organization_id))
    if (filters.type != null) items = items.filter((o) => o.type === filters.type)
    return queryConnection<Organization>(items, 'organization_id', 'Organization', pagination)
  }
}
