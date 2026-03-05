import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql'

import { Episode } from '../episodes/episode.model'
import { EpisodesService } from '../episodes/episodes.service'

const COOKIE = 'favoriteEpisodes'
const COOKIE_OPTS = { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000 }

interface Req {
  cookies?: Record<string, string>
}

interface Res {
  cookie(name: string, value: string, options: object): void
}

function readIds(req: Req): number[] {
  const raw = req.cookies?.[COOKIE]
  if (!raw) return []
  return raw
    .split(',')
    .map(Number)
    .filter((n: number) => Number.isFinite(n) && n > 0)
}

function writeIds(res: Res, ids: number[]) {
  res.cookie(COOKIE, ids.join(','), COOKIE_OPTS)
}

@Resolver()
export class FavoritesResolver {
  constructor(private readonly episodesService: EpisodesService) {}

  @Query(() => [Episode])
  favoriteEpisodes(@Context() ctx: { req: Req }): Episode[] {
    return this.episodesService.findByIds(readIds(ctx.req))
  }

  @Mutation(() => [Episode])
  addFavoriteEpisode(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: { req: Req; res: Res }
  ): Episode[] {
    const ids = readIds(ctx.req)
    if (!ids.includes(id)) ids.push(id)
    writeIds(ctx.res, ids)
    return this.episodesService.findByIds(ids)
  }

  @Mutation(() => [Episode])
  removeFavoriteEpisode(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: { req: Req; res: Res }
  ): Episode[] {
    const ids = readIds(ctx.req).filter((i) => i !== id)
    writeIds(ctx.res, ids)
    return this.episodesService.findByIds(ids)
  }
}
