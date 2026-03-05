import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EpisodesResolver } from '../episodes.resolver'

function makeConnection() {
  return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 }
}

describe('EpisodesResolver', () => {
  let mockEpisodesService: any
  let mockSeriesService: any
  let mockCharactersService: any
  let resolver: EpisodesResolver

  beforeEach(() => {
    mockEpisodesService = {
      findAll: vi.fn().mockReturnValue(makeConnection()),
      findById: vi.fn().mockReturnValue(undefined),
    }
    mockSeriesService = {
      findById: vi.fn().mockReturnValue(undefined),
    }
    mockCharactersService = {
      findByEpisodeId: vi.fn().mockReturnValue(makeConnection()),
    }
    resolver = new EpisodesResolver(mockEpisodesService, mockSeriesService, mockCharactersService)
  })

  describe('findAll', () => {
    it('delegates to episodesService.findAll with pagination args', () => {
      resolver.findAll(undefined, undefined, 5, undefined, undefined, undefined)
      expect(mockEpisodesService.findAll).toHaveBeenCalledWith(
        { series: undefined, season: undefined },
        { first: 5, last: undefined, before: undefined, after: undefined }
      )
    })

    it('passes series filter to service', () => {
      resolver.findAll(2, undefined, undefined, undefined, undefined, undefined)
      expect(mockEpisodesService.findAll).toHaveBeenCalledWith(
        { series: 2, season: undefined },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
    })

    it('passes season filter to service', () => {
      resolver.findAll(undefined, 3, undefined, undefined, undefined, undefined)
      expect(mockEpisodesService.findAll).toHaveBeenCalledWith(
        { series: undefined, season: 3 },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockEpisodesService.findAll.mockReturnValue(conn)
      expect(resolver.findAll()).toBe(conn)
    })
  })

  describe('findById', () => {
    it('delegates to episodesService.findById', () => {
      const row = { episode_id: 5, title: 'Test' }
      mockEpisodesService.findById.mockReturnValue(row)
      expect(resolver.findById(5)).toBe(row)
      expect(mockEpisodesService.findById).toHaveBeenCalledWith(5)
    })

    it('returns undefined when not found', () => {
      expect(resolver.findById(999)).toBeUndefined()
    })
  })

  describe('series (ResolveField)', () => {
    it('delegates to seriesService.findById with episode.series_id', () => {
      const episode = { episode_id: 1, series_id: 3 } as any
      const seriesRow = { series_id: 3, name: 'TNG' }
      mockSeriesService.findById.mockReturnValue(seriesRow)
      const result = resolver.series(episode)
      expect(mockSeriesService.findById).toHaveBeenCalledWith(3)
      expect(result).toBe(seriesRow)
    })
  })

  describe('characters (ResolveField)', () => {
    it('delegates to charactersService.findByEpisodeId with episode and pagination', () => {
      const episode = { episode_id: 10 } as any
      resolver.characters(episode, undefined, undefined, 3, undefined, undefined, undefined)
      expect(mockCharactersService.findByEpisodeId).toHaveBeenCalledWith(
        10,
        { gender: undefined, primaryActor: undefined },
        { first: 3, last: undefined, before: undefined, after: undefined }
      )
    })

    it('passes gender filter to service', () => {
      const episode = { episode_id: 10 } as any
      resolver.characters(episode, 'F', undefined, undefined, undefined, undefined, undefined)
      expect(mockCharactersService.findByEpisodeId).toHaveBeenCalledWith(
        10,
        { gender: 'F', primaryActor: undefined },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockCharactersService.findByEpisodeId.mockReturnValue(conn)
      expect(resolver.characters({ episode_id: 1 } as any)).toBe(conn)
    })
  })
})
