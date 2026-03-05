import { INestApplication } from '@nestjs/common'
import supertest from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { TestApp, createApp } from './helpers/app'

let testApp: TestApp
let app: INestApplication

beforeAll(async () => {
  testApp = await createApp()
  app = testApp.app
}, 30000)

afterAll(async () => {
  await app.close()
})

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

describe('series', () => {
  it('returns a list of series with pagination info', async () => {
    const { gql } = testApp
    const res = await gql(`{
      series(first: 5) {
        edges { cursor node { id name abbreviation } }
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
        totalCount
      }
    }`)
    expect(res.status).toBe(200)
    const { series } = res.body.data
    expect(series.totalCount).toBeGreaterThan(0)
    expect(series.edges.length).toBeGreaterThan(0)
    expect(series.edges[0].node.name).toBeTruthy()
    expect(series.edges[0].cursor).toBeTruthy()
    expect(series.pageInfo.startCursor).toBeTruthy()
    expect(series.pageInfo.endCursor).toBeTruthy()
  })

  it('paginates forward using a cursor', async () => {
    const { gql } = testApp
    const page1 = await gql(
      `{ series(first: 3) { edges { cursor node { id } } pageInfo { endCursor hasNextPage } } }`
    )
    expect(page1.status).toBe(200)
    const { endCursor, hasNextPage } = page1.body.data.series.pageInfo

    if (!hasNextPage) return // not enough data to paginate; skip assertion

    const page2 = await gql(
      `{ series(first: 3, after: "${endCursor}") { edges { node { id } } pageInfo { hasPreviousPage } } }`
    )
    expect(page2.status).toBe(200)
    expect(page2.body.data.series.pageInfo.hasPreviousPage).toBe(true)

    // IDs on page 2 must not overlap with page 1
    const ids1 = page1.body.data.series.edges.map((e: { node: { id: string } }) => e.node.id)
    const ids2 = page2.body.data.series.edges.map((e: { node: { id: string } }) => e.node.id)
    expect(ids2.some((id: string) => ids1.includes(id))).toBe(false)
  })

  it('looks up a series by ID including nested episodes', async () => {
    const { gql } = testApp
    // Fetch any series id first
    const listRes = await gql(`{ series(first: 1) { edges { node { id } } } }`)
    const seriesId = Number(listRes.body.data.series.edges[0].node.id)

    const res = await gql(`{
      seriesById(id: ${seriesId}) {
        id name
        episodes(first: 3) {
          edges { node { id title } }
          totalCount
        }
      }
    }`)
    expect(res.status).toBe(200)
    const series = res.body.data.seriesById
    expect(series).not.toBeNull()
    expect(series.id).toBe(String(seriesId))
    expect(series.episodes.totalCount).toBeGreaterThan(0)
  })

  it('looks up a series by abbreviation', async () => {
    const { gql } = testApp
    // Fetch the abbreviation of any series
    const listRes = await gql(`{ series(first: 1) { edges { node { abbreviation } } } }`)
    const abbreviation = listRes.body.data.series.edges[0].node.abbreviation
    if (!abbreviation) return // series has no abbreviation; skip

    const res = await gql(`{ seriesById(abbreviation: "${abbreviation}") { id abbreviation } }`)
    expect(res.status).toBe(200)
    expect(res.body.data.seriesById?.abbreviation).toBe(abbreviation)
  })

  it('looks up a series by imdbId', async () => {
    const { gql } = testApp
    // Fetch the imdbId of any series
    const listRes = await gql(`{ series(first: 10) { edges { node { id imdbId } } } }`)
    const edge = listRes.body.data.series.edges.find((e: any) => e.node.imdbId)
    if (!edge) return // no series with imdbId; skip

    const { id, imdbId } = edge.node
    const res = await gql(`{ seriesById(imdbId: "${imdbId}") { id imdbId } }`)
    expect(res.status).toBe(200)
    expect(res.body.data.seriesById?.id).toBe(id)
    expect(res.body.data.seriesById?.imdbId).toBe(imdbId)
  })

  it('returns an error when seriesById is called without args', async () => {
    const { gql } = testApp
    const res = await gql(`{ seriesById { id } }`)
    expect(res.status).toBe(200)
    expect(res.body.errors).toBeDefined()
    expect(res.body.errors.length).toBeGreaterThan(0)
  })

  it('filters nested episodes by season', async () => {
    const { gql } = testApp
    const listRes = await gql(`{ series(first: 1) { edges { node { id } } } }`)
    const seriesId = Number(listRes.body.data.series.edges[0].node.id)

    const res = await gql(
      `{ seriesById(id: ${seriesId}) { episodes(season: 1, first: 5) { edges { node { id season } } totalCount } } }`
    )
    expect(res.status).toBe(200)
    for (const edge of res.body.data.seriesById.episodes.edges) {
      expect(edge.node.season).toBe(1)
    }
  })

  it('returns null for a non-existent series ID', async () => {
    const { gql } = testApp
    const res = await gql(`{ seriesById(id: 999999) { id } }`)
    expect(res.status).toBe(200)
    expect(res.body.data.seriesById).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Episodes
// ---------------------------------------------------------------------------

describe('episodes', () => {
  it('returns a list of episodes', async () => {
    const { gql } = testApp
    const res = await gql(`{
      episodes(first: 5) {
        edges { cursor node { id title season episodeNumber } }
        pageInfo { hasNextPage hasPreviousPage }
        totalCount
      }
    }`)
    expect(res.status).toBe(200)
    const { episodes } = res.body.data
    expect(episodes.totalCount).toBeGreaterThan(0)
    expect(episodes.edges[0].node.title).toBeTruthy()
  })

  it('paginates backward using last', async () => {
    const { gql } = testApp
    const res = await gql(`{
      episodes(last: 3) {
        edges { node { id } }
        pageInfo { hasPreviousPage hasNextPage }
      }
    }`)
    expect(res.status).toBe(200)
    const { pageInfo } = res.body.data.episodes
    expect(pageInfo.hasPreviousPage).toBe(true)
    expect(pageInfo.hasNextPage).toBe(false)
  })

  it('fetches a single episode with nested series and characters', async () => {
    const { gql } = testApp
    const listRes = await gql(`{ episodes(first: 1) { edges { node { id } } } }`)
    const episodeId = Number(listRes.body.data.episodes.edges[0].node.id)

    const res = await gql(`{
      episode(id: ${episodeId}) {
        id title airDate
        series { id name }
        characters(first: 3) {
          edges { node { id name } }
          totalCount
        }
      }
    }`)
    expect(res.status).toBe(200)
    const episode = res.body.data.episode
    expect(episode).not.toBeNull()
    expect(episode.title).toBeTruthy()
    expect(episode.series).not.toBeNull()
    expect(episode.series.name).toBeTruthy()
  })

  it('filters episodes by series', async () => {
    const { gql } = testApp
    const listRes = await gql(`{ series(first: 1) { edges { node { id } } } }`)
    const seriesId = Number(listRes.body.data.series.edges[0].node.id)

    const res = await gql(
      `{ episodes(series: ${seriesId}, first: 5) { edges { node { id series { id } } } totalCount } }`
    )
    expect(res.status).toBe(200)
    expect(res.body.data.episodes.totalCount).toBeGreaterThan(0)
    for (const edge of res.body.data.episodes.edges) {
      expect(edge.node.series.id).toBe(String(seriesId))
    }
  })

  it('filters episodes by season', async () => {
    const { gql } = testApp
    const res = await gql(
      `{ episodes(season: 1, first: 5) { edges { node { id season } } totalCount } }`
    )
    expect(res.status).toBe(200)
    for (const edge of res.body.data.episodes.edges) {
      expect(edge.node.season).toBe(1)
    }
  })

  it('returns null for a non-existent episode ID', async () => {
    const { gql } = testApp
    const res = await gql(`{ episode(id: 999999) { id } }`)
    expect(res.status).toBe(200)
    expect(res.body.data.episode).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

describe('characters', () => {
  it('returns a list of characters', async () => {
    const { gql } = testApp
    const res = await gql(`{
      characters(first: 3) {
        edges { node { id name } }
        totalCount
      }
    }`)
    expect(res.status).toBe(200)
    const { characters } = res.body.data
    expect(characters.totalCount).toBeGreaterThan(0)
    expect(characters.edges[0].node.name).toBeTruthy()
  })

  it('fetches a single character with all resolved fields', async () => {
    const { gql } = testApp
    const listRes = await gql(`{ characters(first: 1) { edges { node { id } } } }`)
    const characterId = Number(listRes.body.data.characters.edges[0].node.id)

    const res = await gql(`{
      character(id: ${characterId}) {
        id name rank gender
        species { id name }
        primaryActor { id firstName lastName }
        actors(first: 2) { edges { node { id firstName } } totalCount }
        organizations(first: 2) { edges { node { id name } } totalCount }
        episodes(first: 2) { edges { node { id title } } totalCount }
      }
    }`)
    expect(res.status).toBe(200)
    const character = res.body.data.character
    expect(character).not.toBeNull()
    expect(character.name).toBeTruthy()
    // actors/episodes/organizations are always Connection types (may be empty)
    expect(Array.isArray(character.actors.edges)).toBe(true)
    expect(Array.isArray(character.episodes.edges)).toBe(true)
    expect(Array.isArray(character.organizations.edges)).toBe(true)
  })

  it('filters characters by gender', async () => {
    const { gql } = testApp
    // Fetch a gender value from the db first
    const listRes = await gql(`{ characters(first: 20) { edges { node { gender } } } }`)
    const edge = listRes.body.data.characters.edges.find((e: any) => e.node.gender)
    if (!edge) return // no characters with gender; skip

    const gender = edge.node.gender
    const res = await gql(
      `{ characters(gender: "${gender}", first: 5) { edges { node { id gender } } totalCount } }`
    )
    expect(res.status).toBe(200)
    expect(res.body.data.characters.totalCount).toBeGreaterThan(0)
    for (const e of res.body.data.characters.edges) {
      expect(e.node.gender).toBe(gender)
    }
  })

  it('filters characters by primaryActor', async () => {
    const { gql } = testApp
    // Fetch any actor id first
    const actorRes = await gql(`{ actors(first: 1) { edges { node { id } } } }`)
    const actorId = Number(actorRes.body.data.actors.edges[0].node.id)

    const res = await gql(
      `{ characters(primaryActor: ${actorId}, first: 5) { edges { node { id primaryActor { id } } } } }`
    )
    expect(res.status).toBe(200)
    for (const edge of res.body.data.characters.edges) {
      expect(edge.node.primaryActor?.id).toBe(String(actorId))
    }
  })

  it('filters nested episodes by season', async () => {
    const { gql } = testApp
    const listRes = await gql(`{ characters(first: 1) { edges { node { id } } } }`)
    const characterId = Number(listRes.body.data.characters.edges[0].node.id)

    const res = await gql(
      `{ character(id: ${characterId}) { episodes(season: 1, first: 5) { edges { node { id season } } } } }`
    )
    expect(res.status).toBe(200)
    for (const edge of res.body.data.character.episodes.edges) {
      expect(edge.node.season).toBe(1)
    }
  })

  it('filters nested organizations by type', async () => {
    const { gql } = testApp
    // Find a character with organizations that have a type
    const listRes = await gql(
      `{ characters(first: 50) { edges { node { id organizations(first: 5) { edges { node { type } } } } } } }`
    )
    let characterId: number | null = null
    let orgType: string | null = null
    for (const ce of listRes.body.data.characters.edges) {
      const edge = ce.node.organizations.edges.find((e: any) => e.node.type)
      if (edge) {
        characterId = Number(ce.node.id)
        orgType = edge.node.type
        break
      }
    }
    if (!characterId || !orgType) return // skip if no suitable data

    const res = await gql(
      `{ character(id: ${characterId}) { organizations(type: "${orgType}", first: 5) { edges { node { id type } } } } }`
    )
    expect(res.status).toBe(200)
    for (const edge of res.body.data.character.organizations.edges) {
      expect(edge.node.type).toBe(orgType)
    }
  })

  it('returns null for a non-existent character ID', async () => {
    const { gql } = testApp
    const res = await gql(`{ character(id: 999999) { id } }`)
    expect(res.status).toBe(200)
    expect(res.body.data.character).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Actors
// ---------------------------------------------------------------------------

describe('actors', () => {
  it('returns a list of actors', async () => {
    const { gql } = testApp
    const res = await gql(`{
      actors(first: 5) {
        edges { node { id firstName lastName } }
        totalCount
      }
    }`)
    expect(res.status).toBe(200)
    const { actors } = res.body.data
    expect(actors.totalCount).toBeGreaterThan(0)
    expect(actors.edges[0].node.firstName).toBeTruthy()
  })

  it('filters nested characters by gender', async () => {
    const { gql } = testApp
    const listRes = await gql(`{ actors(first: 1) { edges { node { id } } } }`)
    const actorId = Number(listRes.body.data.actors.edges[0].node.id)

    // Fetch a gender value from db first
    const charsRes = await gql(
      `{ actor(id: ${actorId}) { characters(first: 10) { edges { node { gender } } } } }`
    )
    const edge = charsRes.body.data.actor.characters.edges.find((e: any) => e.node.gender)
    if (!edge) return // skip if no characters with gender

    const gender = edge.node.gender
    const res = await gql(
      `{ actor(id: ${actorId}) { characters(gender: "${gender}", first: 5) { edges { node { id gender } } } } }`
    )
    expect(res.status).toBe(200)
    for (const e of res.body.data.actor.characters.edges) {
      expect(e.node.gender).toBe(gender)
    }
  })

  it('fetches a single actor with nested characters', async () => {
    const { gql } = testApp
    const listRes = await gql(`{ actors(first: 1) { edges { node { id } } } }`)
    const actorId = Number(listRes.body.data.actors.edges[0].node.id)

    const res = await gql(`{
      actor(id: ${actorId}) {
        id firstName lastName birthDate
        characters(first: 2) { edges { node { id name } } totalCount }
      }
    }`)
    expect(res.status).toBe(200)
    const actor = res.body.data.actor
    expect(actor).not.toBeNull()
    expect(actor.firstName).toBeTruthy()
    expect(Array.isArray(actor.characters.edges)).toBe(true)
  })

  it('returns null for a non-existent actor ID', async () => {
    const { gql } = testApp
    const res = await gql(`{ actor(id: 999999) { id } }`)
    expect(res.status).toBe(200)
    expect(res.body.data.actor).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Species
// ---------------------------------------------------------------------------

describe('species', () => {
  it('returns a list of species', async () => {
    const { gql } = testApp
    const res = await gql(`{
      species(first: 5) {
        edges { node { id name homeworld warpCapable } }
        totalCount
      }
    }`)
    expect(res.status).toBe(200)
    const { species } = res.body.data
    expect(species.totalCount).toBeGreaterThan(0)
    expect(species.edges[0].node.name).toBeTruthy()
    expect(typeof species.edges[0].node.warpCapable).toBe('boolean')
  })

  it('filters species by warpCapable=true', async () => {
    const { gql } = testApp
    const res = await gql(
      `{ species(warpCapable: true, first: 5) { edges { node { id warpCapable } } totalCount } }`
    )
    expect(res.status).toBe(200)
    expect(res.body.data.species.totalCount).toBeGreaterThan(0)
    for (const edge of res.body.data.species.edges) {
      expect(edge.node.warpCapable).toBe(true)
    }
  })

  it('filters species by warpCapable=false', async () => {
    const { gql } = testApp
    const res = await gql(
      `{ species(warpCapable: false, first: 5) { edges { node { id warpCapable } } totalCount } }`
    )
    expect(res.status).toBe(200)
    for (const edge of res.body.data.species.edges) {
      expect(edge.node.warpCapable).toBe(false)
    }
  })

  it('filters nested characters by gender', async () => {
    const { gql } = testApp
    const listRes = await gql(`{ species(first: 1) { edges { node { id } } } }`)
    const speciesId = Number(listRes.body.data.species.edges[0].node.id)

    const charsRes = await gql(
      `{ speciesById(id: ${speciesId}) { characters(first: 10) { edges { node { gender } } } } }`
    )
    const edge = charsRes.body.data.speciesById?.characters.edges.find((e: any) => e.node.gender)
    if (!edge) return // skip if no characters with gender

    const gender = edge.node.gender
    const res = await gql(
      `{ speciesById(id: ${speciesId}) { characters(gender: "${gender}", first: 5) { edges { node { id gender } } } } }`
    )
    expect(res.status).toBe(200)
    for (const e of res.body.data.speciesById.characters.edges) {
      expect(e.node.gender).toBe(gender)
    }
  })

  it('fetches a single species with nested characters', async () => {
    const { gql } = testApp
    const listRes = await gql(`{ species(first: 1) { edges { node { id } } } }`)
    const speciesId = Number(listRes.body.data.species.edges[0].node.id)

    const res = await gql(`{
      speciesById(id: ${speciesId}) {
        id name warpCapable
        characters(first: 2) { edges { node { id name } } totalCount }
      }
    }`)
    expect(res.status).toBe(200)
    const species = res.body.data.speciesById
    expect(species).not.toBeNull()
    expect(species.name).toBeTruthy()
    expect(Array.isArray(species.characters.edges)).toBe(true)
  })

  it('returns null for a non-existent species ID', async () => {
    const { gql } = testApp
    const res = await gql(`{ speciesById(id: 999999) { id } }`)
    expect(res.status).toBe(200)
    expect(res.body.data.speciesById).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Ships
// ---------------------------------------------------------------------------

describe('ships', () => {
  it('returns a list of ships', async () => {
    const { gql } = testApp
    const res = await gql(`{
      ships(first: 5) {
        edges { node { id name registry class type } }
        totalCount
      }
    }`)
    expect(res.status).toBe(200)
    const { ships } = res.body.data
    expect(ships.totalCount).toBeGreaterThan(0)
    expect(ships.edges[0].node.name).toBeTruthy()
  })

  it('filters ships by status', async () => {
    const { gql } = testApp
    // Fetch a status value from the db first
    const listRes = await gql(`{ ships(first: 20) { edges { node { status } } } }`)
    const edge = listRes.body.data.ships.edges.find((e: any) => e.node.status)
    if (!edge) return // no ships with status; skip

    const status = edge.node.status
    const res = await gql(
      `{ ships(status: "${status}", first: 5) { edges { node { id status } } totalCount } }`
    )
    expect(res.status).toBe(200)
    expect(res.body.data.ships.totalCount).toBeGreaterThan(0)
    for (const e of res.body.data.ships.edges) {
      expect(e.node.status).toBe(status)
    }
  })

  it('fetches a single ship by ID', async () => {
    const { gql } = testApp
    const listRes = await gql(`{ ships(first: 1) { edges { node { id } } } }`)
    const shipId = Number(listRes.body.data.ships.edges[0].node.id)

    const res = await gql(
      `{ ship(id: ${shipId}) { id name registry class type launchedYear status } }`
    )
    expect(res.status).toBe(200)
    const ship = res.body.data.ship
    expect(ship).not.toBeNull()
    expect(ship.name).toBeTruthy()
  })

  it('returns null for a non-existent ship ID', async () => {
    const { gql } = testApp
    const res = await gql(`{ ship(id: 999999) { id } }`)
    expect(res.status).toBe(200)
    expect(res.body.data.ship).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

describe('organizations', () => {
  it('returns a list of organizations', async () => {
    const { gql } = testApp
    const res = await gql(`{
      organizations(first: 5) {
        edges { node { id name type } }
        totalCount
      }
    }`)
    expect(res.status).toBe(200)
    const { organizations } = res.body.data
    expect(organizations.totalCount).toBeGreaterThan(0)
    expect(organizations.edges[0].node.name).toBeTruthy()
  })

  it('filters organizations by type', async () => {
    const { gql } = testApp
    // Fetch a type value from the db first
    const listRes = await gql(`{ organizations(first: 20) { edges { node { type } } } }`)
    const edge = listRes.body.data.organizations.edges.find((e: any) => e.node.type)
    if (!edge) return // no organizations with type; skip

    const type = edge.node.type
    const res = await gql(
      `{ organizations(type: "${type}", first: 5) { edges { node { id type } } totalCount } }`
    )
    expect(res.status).toBe(200)
    expect(res.body.data.organizations.totalCount).toBeGreaterThan(0)
    for (const e of res.body.data.organizations.edges) {
      expect(e.node.type).toBe(type)
    }
  })

  it('fetches a single organization with nested characters', async () => {
    const { gql } = testApp
    const listRes = await gql(`{ organizations(first: 1) { edges { node { id } } } }`)
    const orgId = Number(listRes.body.data.organizations.edges[0].node.id)

    const res = await gql(`{
      organization(id: ${orgId}) {
        id name type
        characters(first: 2) { edges { node { id name } } totalCount }
      }
    }`)
    expect(res.status).toBe(200)
    const org = res.body.data.organization
    expect(org).not.toBeNull()
    expect(org.name).toBeTruthy()
    expect(Array.isArray(org.characters.edges)).toBe(true)
  })

  it('returns null for a non-existent organization ID', async () => {
    const { gql } = testApp
    const res = await gql(`{ organization(id: 999999) { id } }`)
    expect(res.status).toBe(200)
    expect(res.body.data.organization).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Batched queries
// ---------------------------------------------------------------------------

describe('batched queries', () => {
  it('executes multiple operations in a single request', async () => {
    const agent = supertest(app.getHttpServer())
    const res = await agent
      .post('/graphql')
      .send([
        { query: '{ series(first: 2) { totalCount edges { node { id name } } } }' },
        { query: '{ ships(first: 2) { totalCount edges { node { id name } } } }' },
      ])
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].data.series.totalCount).toBeGreaterThan(0)
    expect(res.body[1].data.ships.totalCount).toBeGreaterThan(0)
  })

  it('returns independent results per operation', async () => {
    const agent = supertest(app.getHttpServer())
    const res = await agent
      .post('/graphql')
      .send([
        { query: '{ series(first: 1) { edges { node { id } } } }' },
        { query: '{ series(first: 3) { edges { node { id } } } }' },
      ])
    expect(res.status).toBe(200)
    expect(res.body[0].data.series.edges).toHaveLength(1)
    expect(res.body[1].data.series.edges).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

describe('favorites', () => {
  it('starts with an empty favorites list', async () => {
    const { gql } = testApp
    const res = await gql('{ favoriteEpisodes { id title } }')
    expect(res.status).toBe(200)
    expect(res.body.data.favoriteEpisodes).toEqual([])
  })

  it('addFavoriteEpisode persists the episode in the cookie', async () => {
    const agent = supertest(app.getHttpServer())

    // Pick a real episode ID
    const listRes = await agent
      .post('/graphql')
      .send({ query: '{ episodes(first: 1) { edges { node { id title } } } }' })
    const { id, title } = listRes.body.data.episodes.edges[0].node

    // Add to favorites
    const addRes = await agent
      .post('/graphql')
      .send({ query: `mutation { addFavoriteEpisode(id: ${id}) { id title } }` })
    expect(addRes.status).toBe(200)
    expect(addRes.body.data.addFavoriteEpisode).toHaveLength(1)
    expect(addRes.body.data.addFavoriteEpisode[0]).toEqual({ id, title })

    // Cookie must be set
    const setCookie = addRes.headers['set-cookie'] as string[] | string
    expect(setCookie).toBeTruthy()

    // Query favorites with the cookie
    const favRes = await agent
      .post('/graphql')
      .set('Cookie', setCookie)
      .send({ query: '{ favoriteEpisodes { id title } }' })
    expect(favRes.status).toBe(200)
    expect(favRes.body.data.favoriteEpisodes).toHaveLength(1)
    expect(favRes.body.data.favoriteEpisodes[0]).toEqual({ id, title })
  })

  it('addFavoriteEpisode is idempotent', async () => {
    const agent = supertest(app.getHttpServer())
    const listRes = await agent
      .post('/graphql')
      .send({ query: '{ episodes(first: 1) { edges { node { id } } } }' })
    const { id } = listRes.body.data.episodes.edges[0].node

    const addRes = await agent
      .post('/graphql')
      .send({ query: `mutation { addFavoriteEpisode(id: ${id}) { id } }` })
    const cookie = addRes.headers['set-cookie']

    // Add same ID again
    const addAgainRes = await agent
      .post('/graphql')
      .set('Cookie', cookie)
      .send({ query: `mutation { addFavoriteEpisode(id: ${id}) { id } }` })
    expect(addAgainRes.body.data.addFavoriteEpisode).toHaveLength(1)
  })

  it('removeFavoriteEpisode removes the episode from the cookie', async () => {
    const agent = supertest(app.getHttpServer())
    const listRes = await agent
      .post('/graphql')
      .send({ query: '{ episodes(first: 1) { edges { node { id } } } }' })
    const { id } = listRes.body.data.episodes.edges[0].node

    // Add then remove
    const addRes = await agent
      .post('/graphql')
      .send({ query: `mutation { addFavoriteEpisode(id: ${id}) { id } }` })
    const addCookie = addRes.headers['set-cookie']

    const removeRes = await agent
      .post('/graphql')
      .set('Cookie', addCookie)
      .send({ query: `mutation { removeFavoriteEpisode(id: ${id}) { id } }` })
    expect(removeRes.status).toBe(200)
    expect(removeRes.body.data.removeFavoriteEpisode).toEqual([])

    // Favorites should now be empty with the updated cookie
    const removeCookie = removeRes.headers['set-cookie']
    const favRes = await agent
      .post('/graphql')
      .set('Cookie', removeCookie)
      .send({ query: '{ favoriteEpisodes { id } }' })
    expect(favRes.body.data.favoriteEpisodes).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// GET request support
// ---------------------------------------------------------------------------

describe('GET requests', () => {
  it('executes a query via GET (csrfPrevention: false)', async () => {
    const { gqlGet } = testApp
    const res = await gqlGet('{ series(first: 1) { totalCount } }')
    expect(res.status).toBe(200)
    expect(res.body.data.series.totalCount).toBeGreaterThan(0)
  })

  it('GET result matches POST result for the same query', async () => {
    const { gql, gqlGet } = testApp
    const query = '{ ships(first: 3) { totalCount edges { node { id name } } } }'
    const [postRes, getRes] = await Promise.all([gql(query), gqlGet(query)])
    expect(postRes.status).toBe(200)
    expect(getRes.status).toBe(200)
    expect(getRes.body.data).toEqual(postRes.body.data)
  })
})
