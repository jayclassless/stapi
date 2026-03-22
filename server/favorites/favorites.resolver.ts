import type { Request, Response } from 'express'
import { Arg, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'

import { Episode } from '../episodes/episode.model.js'
import { EpisodesService } from '../episodes/episodes.service.js'

const COOKIE = 'favoriteEpisodes'
const COOKIE_OPTS = { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000 }

function readIds(req: Request): number[] {
  const raw = req.cookies?.[COOKIE]
  if (!raw) return []
  return raw
    .split(',')
    .map(Number)
    .filter((n: number) => Number.isFinite(n) && n > 0)
}

function writeIds(res: Response, ids: number[]) {
  res.cookie(COOKIE, ids.join(','), COOKIE_OPTS)
}

@Resolver()
export class FavoritesResolver {
  constructor(private readonly episodesService: EpisodesService) {}

  @Query(() => [Episode])
  favoriteEpisodes(@Ctx() ctx: { req: Request }): Episode[] {
    return this.episodesService.findByIds(readIds(ctx.req))
  }

  @Mutation(() => [Episode])
  addFavoriteEpisode(
    @Arg('id', () => Int) id: number,
    @Ctx() ctx: { req: Request; res: Response }
  ): Episode[] {
    const ids = readIds(ctx.req)
    if (!ids.includes(id)) ids.push(id)
    writeIds(ctx.res, ids)
    return this.episodesService.findByIds(ids)
  }

  @Mutation(() => [Episode])
  removeFavoriteEpisode(
    @Arg('id', () => Int) id: number,
    @Ctx() ctx: { req: Request; res: Response }
  ): Episode[] {
    const ids = readIds(ctx.req).filter((i) => i !== id)
    writeIds(ctx.res, ids)
    return this.episodesService.findByIds(ids)
  }
}
