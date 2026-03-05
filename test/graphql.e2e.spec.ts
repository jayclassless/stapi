import { INestApplication } from '@nestjs/common'
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

  it('returns an error when seriesById is called without args', async () => {
    const { gql } = testApp
    const res = await gql(`{ seriesById { id } }`)
    expect(res.status).toBe(200)
    expect(res.body.errors).toBeDefined()
    expect(res.body.errors.length).toBeGreaterThan(0)
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
