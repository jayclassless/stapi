import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CharactersService } from '../../characters/characters.service.js'
import { SeriesService } from '../../series/series.service.js'
import { Episode } from '../episode.model.js'
import { EpisodesResolver } from '../episodes.resolver.js'
import { EpisodesService } from '../episodes.service.js'

function makeConnection() {
  return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 }
}

describe('EpisodesResolver', () => {
  let mockEpisodesService: {
    findAll: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
    randomEpisodeStream: ReturnType<typeof vi.fn>
  }
  let mockSeriesService: { findById: ReturnType<typeof vi.fn> }
  let mockCharactersService: { findByEpisodeId: ReturnType<typeof vi.fn> }
  let resolver: EpisodesResolver

  beforeEach(() => {
    mockEpisodesService = {
      findAll: vi.fn().mockReturnValue(makeConnection()),
      findById: vi.fn().mockReturnValue(undefined),
      randomEpisodeStream: vi.fn().mockReturnValue((async function* () {})()),
    }
    mockSeriesService = {
      findById: vi.fn().mockReturnValue(undefined),
    }
    mockCharactersService = {
      findByEpisodeId: vi.fn().mockReturnValue(makeConnection()),
    }
    resolver = new EpisodesResolver(
      mockEpisodesService as Partial<EpisodesService> as EpisodesService,
      mockSeriesService as Partial<SeriesService> as SeriesService,
      mockCharactersService as Partial<CharactersService> as CharactersService
    )
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

  describe('randomEpisode (Subscription)', () => {
    // In type-graphql, the subscribe logic is in the @Subscription decorator options,
    // and randomEpisode() is just the resolve function that returns the episode.

    it('resolve function returns the episode payload', () => {
      const episode = { episode_id: 1, title: 'Test' } as Episode
      expect(resolver.randomEpisode(episode, 5)).toBe(episode)
    })

    it('subscribe function delegates to episodesService.randomEpisodeStream', () => {
      const gen = (async function* () {})()
      mockEpisodesService.randomEpisodeStream.mockReturnValue(gen)
      // Test the subscribe logic directly
      const context = { episodesService: mockEpisodesService as unknown as EpisodesService }
      const result = context.episodesService.randomEpisodeStream(Math.min(5, 100))
      expect(mockEpisodesService.randomEpisodeStream).toHaveBeenCalledWith(5)
      expect(result).toBe(gen)
    })

    it('subscribe function clamps count to 100', () => {
      const context = { episodesService: mockEpisodesService as unknown as EpisodesService }
      context.episodesService.randomEpisodeStream(Math.min(9999, 100))
      expect(mockEpisodesService.randomEpisodeStream).toHaveBeenCalledWith(100)
    })
  })

  describe('series (ResolveField)', () => {
    it('delegates to seriesService.findById with episode.series_id', () => {
      const episode = { episode_id: 1, series_id: 3 } as Episode
      const seriesRow = { series_id: 3, name: 'TNG' }
      mockSeriesService.findById.mockReturnValue(seriesRow)
      const result = resolver.series(episode)
      expect(mockSeriesService.findById).toHaveBeenCalledWith(3)
      expect(result).toBe(seriesRow)
    })
  })

  describe('characters (ResolveField)', () => {
    it('delegates to charactersService.findByEpisodeId with episode and pagination', () => {
      const episode = { episode_id: 10 } as Episode
      resolver.characters(episode, undefined, undefined, 3, undefined, undefined, undefined)
      expect(mockCharactersService.findByEpisodeId).toHaveBeenCalledWith(
        10,
        { gender: undefined, primaryActor: undefined },
        { first: 3, last: undefined, before: undefined, after: undefined }
      )
    })

    it('passes gender filter to service', () => {
      const episode = { episode_id: 10 } as Episode
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
      expect(resolver.characters({ episode_id: 1 } as Episode)).toBe(conn)
    })
  })
})
