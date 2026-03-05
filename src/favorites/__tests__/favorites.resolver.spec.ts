import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Episode } from '../../episodes/episode.model'
import { EpisodesService } from '../../episodes/episodes.service'
import { FavoritesResolver } from '../favorites.resolver'

function makeEpisode(id: number) {
  return { episode_id: id, title: `Episode ${id}` } as Episode
}

function makeCtx(cookieVal?: string) {
  return {
    req: { cookies: cookieVal !== undefined ? { favoriteEpisodes: cookieVal } : {} },
    res: { cookie: vi.fn() },
  } as object as { req: Request; res: Response }
}

describe('FavoritesResolver', () => {
  let mockEpisodesService: { findByIds: ReturnType<typeof vi.fn> }
  let resolver: FavoritesResolver

  beforeEach(() => {
    mockEpisodesService = { findByIds: vi.fn().mockReturnValue([]) }
    resolver = new FavoritesResolver(
      mockEpisodesService as Partial<EpisodesService> as EpisodesService
    )
  })

  describe('favoriteEpisodes', () => {
    it('returns [] when cookie is absent', () => {
      const ctx = makeCtx()
      expect(resolver.favoriteEpisodes(ctx)).toEqual([])
      expect(mockEpisodesService.findByIds).toHaveBeenCalledWith([])
    })

    it('resolves IDs stored in the cookie in a single batch call', () => {
      const episodes = [makeEpisode(1), makeEpisode(2)]
      mockEpisodesService.findByIds.mockReturnValue(episodes)
      const ctx = makeCtx('1,2')
      const result = resolver.favoriteEpisodes(ctx)
      expect(result).toBe(episodes)
      expect(mockEpisodesService.findByIds).toHaveBeenCalledWith([1, 2])
    })

    it('returns only existing episodes (delegated to findByIds)', () => {
      mockEpisodesService.findByIds.mockReturnValue([])
      const ctx = makeCtx('999')
      expect(resolver.favoriteEpisodes(ctx)).toEqual([])
    })
  })

  describe('addFavoriteEpisode', () => {
    it('adds an ID, writes the cookie, and calls findByIds with updated list', () => {
      const episode = makeEpisode(5)
      mockEpisodesService.findByIds.mockReturnValue([episode])
      const ctx = makeCtx()
      const result = resolver.addFavoriteEpisode(5, ctx)
      expect(result).toEqual([episode])
      expect(mockEpisodesService.findByIds).toHaveBeenCalledWith([5])
      expect(ctx.res.cookie).toHaveBeenCalledWith(
        'favoriteEpisodes',
        '5',
        expect.objectContaining({ httpOnly: true })
      )
    })

    it('does not duplicate an ID already in the cookie', () => {
      mockEpisodesService.findByIds.mockReturnValue([makeEpisode(5)])
      const ctx = makeCtx('5')
      resolver.addFavoriteEpisode(5, ctx)
      expect(mockEpisodesService.findByIds).toHaveBeenCalledWith([5])
      expect(ctx.res.cookie).toHaveBeenCalledWith('favoriteEpisodes', '5', expect.anything())
    })

    it('appends to an existing list', () => {
      const episodes = [makeEpisode(1), makeEpisode(2), makeEpisode(3)]
      mockEpisodesService.findByIds.mockReturnValue(episodes)
      const ctx = makeCtx('1,2')
      const result = resolver.addFavoriteEpisode(3, ctx)
      expect(result).toHaveLength(3)
      expect(mockEpisodesService.findByIds).toHaveBeenCalledWith([1, 2, 3])
      expect(ctx.res.cookie).toHaveBeenCalledWith('favoriteEpisodes', '1,2,3', expect.anything())
    })
  })

  describe('removeFavoriteEpisode', () => {
    it('removes an ID, writes the cookie, and calls findByIds with updated list', () => {
      const episodes = [makeEpisode(1), makeEpisode(3)]
      mockEpisodesService.findByIds.mockReturnValue(episodes)
      const ctx = makeCtx('1,2,3')
      const result = resolver.removeFavoriteEpisode(2, ctx)
      expect(result).toHaveLength(2)
      expect(mockEpisodesService.findByIds).toHaveBeenCalledWith([1, 3])
      expect(ctx.res.cookie).toHaveBeenCalledWith('favoriteEpisodes', '1,3', expect.anything())
    })

    it('is a no-op when the ID is not in the list', () => {
      mockEpisodesService.findByIds.mockReturnValue([makeEpisode(1), makeEpisode(2)])
      const ctx = makeCtx('1,2')
      resolver.removeFavoriteEpisode(99, ctx)
      expect(mockEpisodesService.findByIds).toHaveBeenCalledWith([1, 2])
      expect(ctx.res.cookie).toHaveBeenCalledWith('favoriteEpisodes', '1,2', expect.anything())
    })

    it('returns [] when removing the last ID', () => {
      const ctx = makeCtx('5')
      const result = resolver.removeFavoriteEpisode(5, ctx)
      expect(result).toEqual([])
      expect(mockEpisodesService.findByIds).toHaveBeenCalledWith([])
      expect(ctx.res.cookie).toHaveBeenCalledWith('favoriteEpisodes', '', expect.anything())
    })
  })
})
