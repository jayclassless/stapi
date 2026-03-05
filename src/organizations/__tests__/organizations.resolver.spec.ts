import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrganizationsResolver } from '../organizations.resolver'

function makeConnection() {
  return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 }
}

describe('OrganizationsResolver', () => {
  let mockOrganizationsService: any
  let mockCharactersService: any
  let resolver: OrganizationsResolver

  beforeEach(() => {
    mockOrganizationsService = {
      findAll: vi.fn().mockReturnValue(makeConnection()),
      findById: vi.fn().mockReturnValue(undefined),
    }
    mockCharactersService = {
      findByOrganizationId: vi.fn().mockReturnValue(makeConnection()),
    }
    resolver = new OrganizationsResolver(mockOrganizationsService, mockCharactersService)
  })

  describe('findAll', () => {
    it('delegates to organizationsService.findAll with pagination args', () => {
      resolver.findAll(5, undefined, undefined, undefined)
      expect(mockOrganizationsService.findAll).toHaveBeenCalledWith({
        first: 5,
        last: undefined,
        before: undefined,
        after: undefined,
      })
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockOrganizationsService.findAll.mockReturnValue(conn)
      expect(resolver.findAll()).toBe(conn)
    })
  })

  describe('findById', () => {
    it('delegates to organizationsService.findById', () => {
      const row = { organization_id: 1, name: 'Starfleet', type: 'Military' }
      mockOrganizationsService.findById.mockReturnValue(row)
      expect(resolver.findById(1)).toBe(row)
      expect(mockOrganizationsService.findById).toHaveBeenCalledWith(1)
    })

    it('returns undefined when not found', () => {
      expect(resolver.findById(999)).toBeUndefined()
    })
  })

  describe('characters (ResolveField)', () => {
    it('delegates to charactersService.findByOrganizationId with organization and pagination', () => {
      const organization = { organization_id: 2 } as any
      resolver.characters(organization, 10, undefined, undefined, undefined)
      expect(mockCharactersService.findByOrganizationId).toHaveBeenCalledWith(2, {
        first: 10,
        last: undefined,
        before: undefined,
        after: undefined,
      })
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockCharactersService.findByOrganizationId.mockReturnValue(conn)
      expect(resolver.characters({ organization_id: 1 } as any)).toBe(conn)
    })
  })
})
