import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EpisodesService } from '../../episodes/episodes.service.js'
import { Series } from '../series.model.js'
import { SeriesResolver } from '../series.resolver.js'
import { SeriesService } from '../series.service.js'

function makeConnection() {
  return {
    edges: [] as never[],
    pageInfo: { hasNextPage: false, hasPreviousPage: false },
    totalCount: 0,
  }
}

describe('SeriesResolver', () => {
  let mockSeriesService: {
    findAll: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
    findByAbbreviation: ReturnType<typeof vi.fn>
    findByImdbId: ReturnType<typeof vi.fn>
  }
  let mockEpisodesService: { findBySeriesId: ReturnType<typeof vi.fn> }
  let resolver: SeriesResolver

  beforeEach(() => {
    mockSeriesService = {
      findAll: vi.fn().mockReturnValue(makeConnection()),
      findById: vi.fn().mockReturnValue(undefined),
      findByAbbreviation: vi.fn().mockReturnValue(undefined),
      findByImdbId: vi.fn().mockReturnValue(undefined),
    }
    mockEpisodesService = {
      findBySeriesId: vi.fn().mockReturnValue(makeConnection()),
    }
    resolver = new SeriesResolver(
      mockSeriesService as Partial<SeriesService> as SeriesService,
      mockEpisodesService as Partial<EpisodesService> as EpisodesService
    )
  })

  describe('findAll', () => {
    it('delegates to seriesService.findAll with pagination args', () => {
      resolver.findAll(10, undefined, undefined, undefined)
      expect(mockSeriesService.findAll).toHaveBeenCalledWith({
        first: 10,
        last: undefined,
        before: undefined,
        after: undefined,
      })
    })

    it('forwards all pagination args', () => {
      resolver.findAll(undefined, 5, 'cursor1', 'cursor2')
      expect(mockSeriesService.findAll).toHaveBeenCalledWith({
        first: undefined,
        last: 5,
        before: 'cursor1',
        after: 'cursor2',
      })
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockSeriesService.findAll.mockReturnValue(conn)
      expect(resolver.findAll()).toBe(conn)
    })
  })

  describe('findById', () => {
    it('throws GraphQLError when multiple args are provided', () => {
      expect(() => resolver.findById(1, 'TNG', undefined)).toThrow(GraphQLError)
      expect(() => resolver.findById(1, 'TNG', undefined)).toThrow(
        'Exactly one of id, abbreviation, or imdbId is required'
      )
    })

    it('throws GraphQLError when no args are provided', () => {
      expect(() => resolver.findById(undefined, undefined, undefined)).toThrow(GraphQLError)
    })

    it('calls findById when only id is provided', () => {
      const row = { series_id: 1, name: 'TNG' }
      mockSeriesService.findById.mockReturnValue(row)
      const result = resolver.findById(1, undefined, undefined)
      expect(mockSeriesService.findById).toHaveBeenCalledWith(1)
      expect(result).toBe(row)
    })

    it('calls findByAbbreviation when only abbreviation is provided', () => {
      const row = { series_id: 2, abbreviation: 'DS9' }
      mockSeriesService.findByAbbreviation.mockReturnValue(row)
      const result = resolver.findById(undefined, 'DS9', undefined)
      expect(mockSeriesService.findByAbbreviation).toHaveBeenCalledWith('DS9')
      expect(result).toBe(row)
    })

    it('calls findByImdbId when only imdbId is provided', () => {
      const row = { series_id: 3, imdb_id: 'tt0092455' }
      mockSeriesService.findByImdbId.mockReturnValue(row)
      const result = resolver.findById(undefined, undefined, 'tt0092455')
      expect(mockSeriesService.findByImdbId).toHaveBeenCalledWith('tt0092455')
      expect(result).toBe(row)
    })
  })

  describe('episodes (ResolveField)', () => {
    it('delegates to episodesService.findBySeriesId with series and pagination', () => {
      const series = { series_id: 7 } as Series
      resolver.episodes(series, undefined, 5, undefined, undefined, undefined)
      expect(mockEpisodesService.findBySeriesId).toHaveBeenCalledWith(
        7,
        { season: undefined },
        { first: 5, last: undefined, before: undefined, after: undefined }
      )
    })

    it('passes season filter to service', () => {
      const series = { series_id: 7 } as Series
      resolver.episodes(series, 2, undefined, undefined, undefined, undefined)
      expect(mockEpisodesService.findBySeriesId).toHaveBeenCalledWith(
        7,
        { season: 2 },
        { first: undefined, last: undefined, before: undefined, after: undefined }
      )
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockEpisodesService.findBySeriesId.mockReturnValue(conn)
      expect(resolver.episodes({ series_id: 1 } as Series)).toBe(conn)
    })
  })
})
