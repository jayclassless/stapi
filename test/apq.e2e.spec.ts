import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { type TestApp, createApp } from './helpers/app'

let testApp: TestApp

beforeAll(async () => {
  testApp = await createApp()
}, 30000)

afterAll(async () => {
  await testApp.cleanup()
})

const SERIES_QUERY = `{ series(first: 2) { edges { node { id name } } totalCount } }`

describe('automatic persisted queries', () => {
  it('returns PersistedQueryNotFound for hash-only request of unknown query', async () => {
    const res = await testApp.gqlApqHashOnly(SERIES_QUERY)
    expect(res.status).toBe(200)
    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe('PersistedQueryNotFound')
  })

  it('registers a query when sent with both query text and hash', async () => {
    const res = await testApp.gqlApqRegister(SERIES_QUERY)
    expect(res.status).toBe(200)
    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.series.totalCount).toBeGreaterThan(0)
  })

  it('returns cached result for hash-only request after registration', async () => {
    const res = await testApp.gqlApqHashOnly(SERIES_QUERY)
    expect(res.status).toBe(200)
    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.series.totalCount).toBeGreaterThan(0)
    expect(res.body.data.series.edges.length).toBeGreaterThan(0)
  })

  it('works with GET requests after registration', async () => {
    // Query was already registered above via POST
    const res = await testApp.gqlApqGetHashOnly(SERIES_QUERY)
    expect(res.status).toBe(200)
    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.series.totalCount).toBeGreaterThan(0)
  })

  it('returns PersistedQueryNotFound for GET hash-only request of unknown query', async () => {
    const unknownQuery = `{ series(first: 1) { totalCount } }`
    const res = await testApp.gqlApqGetHashOnly(unknownQuery)
    expect(res.status).toBe(200)
    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toBe('PersistedQueryNotFound')
  })

  it('rejects a request with an incorrect hash', async () => {
    const res = await testApp.gql('unused').send({
      query: SERIES_QUERY,
      extensions: { persistedQuery: { version: 1, sha256Hash: 'badhash' } },
    })
    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/provided sha does not match/)
  })
})
