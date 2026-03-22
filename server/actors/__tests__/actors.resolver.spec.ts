import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CharactersService } from '../../characters/characters.service.js'
import { Actor } from '../actor.model.js'
import { ActorsResolver } from '../actors.resolver.js'
import { ActorsService } from '../actors.service.js'

function makeConnection() {
  return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 }
}

describe('ActorsResolver', () => {
  let mockActorsService: {
    findAll: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
  }
  let mockCharactersService: { findByActorId: ReturnType<typeof vi.fn> }
  let resolver: ActorsResolver

  beforeEach(() => {
    mockActorsService = {
      findAll: vi.fn().mockReturnValue(makeConnection()),
      findById: vi.fn().mockReturnValue(undefined),
    }
    mockCharactersService = {
      findByActorId: vi.fn().mockReturnValue(makeConnection()),
    }
    resolver = new ActorsResolver(
      mockActorsService as Partial<ActorsService> as ActorsService,
      mockCharactersService as Partial<CharactersService> as CharactersService
    )
  })

  describe('findAll', () => {
    it('delegates to actorsService.findAll with pagination args', () => {
      resolver.findAll(5, undefined, undefined, undefined)
      expect(mockActorsService.findAll).toHaveBeenCalledWith({
        first: 5,
        last: undefined,
        before: undefined,
        after: undefined,
      })
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockActorsService.findAll.mockReturnValue(conn)
      expect(resolver.findAll()).toBe(conn)
    })
  })

  describe('findById', () => {
    it('delegates to actorsService.findById', () => {
      const row = { actor_id: 3, first_name: 'Patrick' }
      mockActorsService.findById.mockReturnValue(row)
      expect(resolver.findById(3)).toBe(row)
      expect(mockActorsService.findById).toHaveBeenCalledWith(3)
    })

    it('returns undefined when not found', () => {
      expect(resolver.findById(999)).toBeUndefined()
    })
  })

  describe('characters (ResolveField)', () => {
    it('delegates to charactersService.findByActorId with actor and pagination', () => {
      const actor = { actor_id: 2 } as Actor
      resolver.characters(actor, undefined, undefined, 10, undefined, undefined, undefined)
      expect(mockCharactersService.findByActorId).toHaveBeenCalledWith(
        2,
        { gender: undefined, primaryActor: undefined },
        { first: 10, last: undefined, before: undefined, after: undefined }
      )
    })

    it('passes gender filter to service', () => {
      const actor = { actor_id: 2 } as Actor
      resolver.characters(actor, 'M', undefined, undefined, undefined, undefined, undefined)
      expect(mockCharactersService.findByActorId).toHaveBeenCalledWith(
        2,
        { gender: 'M', primaryActor: undefined },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockCharactersService.findByActorId.mockReturnValue(conn)
      expect(resolver.characters({ actor_id: 1 } as Actor)).toBe(conn)
    })
  })
})
