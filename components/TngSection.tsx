import { useState } from 'react'

import { ResultTable } from '@/components/utils'
import { apqGetClient, apqPostClient, getClient, postClient } from '@/lib/apollo'
import { TNG_SEASON_2_QUERY } from '@/lib/operations'
import type { EpisodeNode } from '@/lib/types'

type State = {
  status: 'idle' | 'loading' | 'success' | 'error'
  rows: EpisodeNode[]
  total: number
  error: string | null
  method: string | null
}

const TNG_VARS = { abbreviation: 'TNG', season: 2 }
const COLUMNS = ['id', 'title', 'episodeNumber', 'airDate', 'imdbRating', 'description']

export function TngSection() {
  const [state, setState] = useState<State>({
    status: 'idle',
    rows: [],
    total: 0,
    error: null,
    method: null,
  })

  const clients = {
    POST: postClient,
    GET: getClient,
    'APQ POST': apqPostClient,
    'APQ GET': apqGetClient,
  } as const

  async function query(method: keyof typeof clients) {
    setState((s) => ({ ...s, status: 'loading', method }))
    try {
      const client = clients[method]
      const result = await client.query({
        query: TNG_SEASON_2_QUERY,
        variables: TNG_VARS,
        fetchPolicy: 'no-cache',
      })
      const conn = (result.data as any)?.seriesById?.episodes
      setState({
        status: 'success',
        rows: conn?.edges.map((e: { node: EpisodeNode }) => e.node) ?? [],
        total: conn?.totalCount ?? 0,
        error: null,
        method,
      })
    } catch (err: unknown) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      }))
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <span className="badge badge-query">Query</span>
        <h2>TNG — Season 2 Episodes</h2>
      </div>
      <div className="card-body">
        <div className="controls">
          <button
            className="btn btn-post"
            onClick={() => query('POST')}
            disabled={state.status === 'loading'}
          >
            POST /graphql
          </button>
          <button
            className="btn btn-get"
            onClick={() => query('GET')}
            disabled={state.status === 'loading'}
          >
            GET /graphql
          </button>
          <button
            className="btn btn-post"
            onClick={() => query('APQ POST')}
            disabled={state.status === 'loading'}
          >
            APQ POST /graphql
          </button>
          <button
            className="btn btn-get"
            onClick={() => query('APQ GET')}
            disabled={state.status === 'loading'}
          >
            APQ GET /graphql
          </button>
          {state.method && state.status !== 'loading' && (
            <span className="method-tag">
              {state.method} · vars: {JSON.stringify(TNG_VARS)}
            </span>
          )}
        </div>
        <div className="output output-has-content">
          {state.status === 'idle' && (
            <span className="out-loading" style={{ fontStyle: 'italic' }}>
              Press a button to fetch TNG Season 2 episodes.
            </span>
          )}
          {state.status === 'loading' && <span className="out-loading">Fetching…</span>}
          {state.status === 'error' && <span className="out-error">Error: {state.error}</span>}
          {state.status === 'success' && (
            <>
              <p className="out-total">{state.total} episodes</p>
              <ResultTable rows={state.rows} columns={COLUMNS} />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
