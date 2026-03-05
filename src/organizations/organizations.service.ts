import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Organization, OrganizationConnection } from './organization.model';
import { PaginationInput } from '../common/pagination.input';
import { queryConnection } from '../common/cursor.helper';

@Injectable()
export class OrganizationsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(pagination: PaginationInput = {}): OrganizationConnection {
    return queryConnection<Organization>(
      this.db,
      'SELECT * FROM Organizations',
      [],
      'organization_id',
      'Organization',
      pagination,
    );
  }

  findById(id: number): Organization | undefined {
    return this.db.queryOne<Organization>(
      'SELECT * FROM Organizations WHERE organization_id = ?',
      [id],
    );
  }

  findByCharacterId(characterId: number, pagination: PaginationInput = {}): OrganizationConnection {
    return queryConnection<Organization>(
      this.db,
      'SELECT o.* FROM Organizations o JOIN Character_Organizations co ON co.organization_id = o.organization_id WHERE co.character_id = ?',
      [characterId],
      'organization_id',
      'Organization',
      pagination,
    );
  }
}
