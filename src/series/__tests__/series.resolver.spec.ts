import { UserInputError } from '@nestjs/apollo'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SeriesResolver } from '../series.resolver'

function makeConnection() {
  return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 }
}

describe('SeriesResolver', () => {
  let mockSeriesService: any
  let mockEpisodesService: any
  let resolver: SeriesResolver

  beforeEach(() => {
    mockSeriesService = {
      findAll: vi.fn().mockReturnValue(makeConnection()),
      findById: vi.fn().mockReturnValue(undefined),
      findByAbbreviation: vi.fn().mockReturnValue(undefined),
    }
    mockEpisodesService = {
      findBySeriesId: vi.fn().mockReturnValue(makeConnection()),
    }
    resolver = new SeriesResolver(mockSeriesService, mockEpisodesService)
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
    it('throws UserInputError when both id and abbreviation are provided', () => {
      expect(() => resolver.findById(1, 'TNG')).toThrow(UserInputError)
      expect(() => resolver.findById(1, 'TNG')).toThrow(
        'Exactly one of id or abbreviation is required'
      )
    })

    it('throws UserInputError when neither id nor abbreviation are provided', () => {
      expect(() => resolver.findById(undefined, undefined)).toThrow(UserInputError)
    })

    it('calls findById when only id is provided', () => {
      const row = { series_id: 1, name: 'TNG' }
      mockSeriesService.findById.mockReturnValue(row)
      const result = resolver.findById(1, undefined)
      expect(mockSeriesService.findById).toHaveBeenCalledWith(1)
      expect(result).toBe(row)
    })

    it('calls findByAbbreviation when only abbreviation is provided', () => {
      const row = { series_id: 2, abbreviation: 'DS9' }
      mockSeriesService.findByAbbreviation.mockReturnValue(row)
      const result = resolver.findById(undefined, 'DS9')
      expect(mockSeriesService.findByAbbreviation).toHaveBeenCalledWith('DS9')
      expect(result).toBe(row)
    })
  })

  describe('episodes (ResolveField)', () => {
    it('delegates to episodesService.findBySeriesId with series and pagination', () => {
      const series = { series_id: 7 } as any
      resolver.episodes(series, 5, undefined, undefined, undefined)
      expect(mockEpisodesService.findBySeriesId).toHaveBeenCalledWith(7, {
        first: 5,
        last: undefined,
        before: undefined,
        after: undefined,
      })
    })

    it('returns the service result', () => {
      const conn = makeConnection()
      mockEpisodesService.findBySeriesId.mockReturnValue(conn)
      expect(resolver.episodes({ series_id: 1 } as any)).toBe(conn)
    })
  })
})
