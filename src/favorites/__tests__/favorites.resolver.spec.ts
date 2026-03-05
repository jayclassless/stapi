import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FavoritesResolver } from '../favorites.resolver'

function makeEpisode(id: number) {
  return { episode_id: id, title: `Episode ${id}` } as any
}

function makeCtx(cookieVal?: string) {
  return {
    req: { cookies: cookieVal !== undefined ? { favoriteEpisodes: cookieVal } : {} },
    res: { cookie: vi.fn() },
  }
}

describe('FavoritesResolver', () => {
  let mockEpisodesService: any
  let resolver: FavoritesResolver

  beforeEach(() => {
    mockEpisodesService = { findById: vi.fn() }
    resolver = new FavoritesResolver(mockEpisodesService)
  })

  describe('favoriteEpisodes', () => {
    it('returns [] when cookie is absent', () => {
      const ctx = makeCtx()
      expect(resolver.favoriteEpisodes(ctx)).toEqual([])
      expect(mockEpisodesService.findById).not.toHaveBeenCalled()
    })

    it('resolves IDs stored in the cookie', () => {
      mockEpisodesService.findById.mockImplementation((id: number) => makeEpisode(id))
      const ctx = makeCtx('1,2')
      const result = resolver.favoriteEpisodes(ctx)
      expect(result).toHaveLength(2)
      expect(mockEpisodesService.findById).toHaveBeenCalledWith(1)
      expect(mockEpisodesService.findById).toHaveBeenCalledWith(2)
    })

    it('filters out IDs whose episodes no longer exist', () => {
      mockEpisodesService.findById.mockReturnValue(undefined)
      const ctx = makeCtx('999')
      expect(resolver.favoriteEpisodes(ctx)).toEqual([])
    })
  })

  describe('addFavoriteEpisode', () => {
    it('adds an ID, writes the cookie, and returns the updated list', () => {
      mockEpisodesService.findById.mockImplementation((id: number) => makeEpisode(id))
      const ctx = makeCtx()
      const result = resolver.addFavoriteEpisode(5, ctx)
      expect(result).toHaveLength(1)
      expect(result[0].episode_id).toBe(5)
      expect(ctx.res.cookie).toHaveBeenCalledWith(
        'favoriteEpisodes',
        '5',
        expect.objectContaining({ httpOnly: true })
      )
    })

    it('does not duplicate an ID already in the cookie', () => {
      mockEpisodesService.findById.mockImplementation((id: number) => makeEpisode(id))
      const ctx = makeCtx('5')
      resolver.addFavoriteEpisode(5, ctx)
      expect(ctx.res.cookie).toHaveBeenCalledWith('favoriteEpisodes', '5', expect.anything())
    })

    it('appends to an existing list', () => {
      mockEpisodesService.findById.mockImplementation((id: number) => makeEpisode(id))
      const ctx = makeCtx('1,2')
      const result = resolver.addFavoriteEpisode(3, ctx)
      expect(result).toHaveLength(3)
      expect(ctx.res.cookie).toHaveBeenCalledWith('favoriteEpisodes', '1,2,3', expect.anything())
    })
  })

  describe('removeFavoriteEpisode', () => {
    it('removes an ID, writes the cookie, and returns the updated list', () => {
      mockEpisodesService.findById.mockImplementation((id: number) => makeEpisode(id))
      const ctx = makeCtx('1,2,3')
      const result = resolver.removeFavoriteEpisode(2, ctx)
      expect(result).toHaveLength(2)
      expect(ctx.res.cookie).toHaveBeenCalledWith('favoriteEpisodes', '1,3', expect.anything())
    })

    it('is a no-op when the ID is not in the list', () => {
      mockEpisodesService.findById.mockImplementation((id: number) => makeEpisode(id))
      const ctx = makeCtx('1,2')
      resolver.removeFavoriteEpisode(99, ctx)
      expect(ctx.res.cookie).toHaveBeenCalledWith('favoriteEpisodes', '1,2', expect.anything())
    })

    it('returns [] when removing the last ID', () => {
      const ctx = makeCtx('5')
      const result = resolver.removeFavoriteEpisode(5, ctx)
      expect(result).toEqual([])
      expect(ctx.res.cookie).toHaveBeenCalledWith('favoriteEpisodes', '', expect.anything())
    })
  })
})
