import { useState } from 'react'

import { ALL_SERIES_STR, ONE_EPISODE_STR, TNG_SEASON_2_STR } from '../operations'
import { ResultTable } from '../utils'

type SubResult = { data?: Record<string, unknown>; errors?: { message: string }[] }
type State = {
  status: 'idle' | 'loading' | 'success' | 'error'
  results: [SubResult, SubResult, SubResult] | null
  error: string | null
  method: string | null
}

const TNG_VARS = { abbreviation: 'TNG', season: 2 }
const EPISODE_VARS = { id: 1 }

export function BatchSection() {
  const [state, setState] = useState<State>({
    status: 'idle',
    results: null,
    error: null,
    method: null,
  })

  async function doBatchPost() {
    setState((s) => ({ ...s, status: 'loading', method: 'POST' }))
    try {
      const body = [
        { query: ALL_SERIES_STR },
        { query: TNG_SEASON_2_STR, variables: TNG_VARS },
        { query: ONE_EPISODE_STR, variables: EPISODE_VARS },
      ]
      const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setState({
        status: 'success',
        results: data as [SubResult, SubResult, SubResult],
        error: null,
        method: 'POST',
      })
    } catch (err: unknown) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      }))
    }
  }

  const seriesRows = state.results
    ? ((
        state.results[0].data?.series as { edges: { node: Record<string, unknown> }[] } | undefined
      )?.edges.map((e) => e.node) ?? [])
    : []

  const seriesById = state.results?.[1].data?.['seriesById'] as
    | { episodes: { edges: { node: Record<string, unknown> }[] } }
    | undefined
  const tngRows = seriesById?.episodes.edges.map((e) => e.node) ?? []

  const episodeRow = state.results?.[2].data?.episode
    ? [state.results[2].data.episode as Record<string, unknown>]
    : []

  return (
    <section className="card card-full">
      <div className="card-header">
        <span className="badge badge-query">Query</span>
        <h2>Batched Query</h2>
      </div>
      <div className="card-body">
        <div className="controls">
          <button
            className="btn btn-post"
            onClick={doBatchPost}
            disabled={state.status === 'loading'}
          >
            POST (batch array)
          </button>
          {state.method && state.status !== 'loading' && (
            <span className="method-tag">{state.method}</span>
          )}
        </div>

        {state.status === 'idle' && (
          <div className="output">
            <span style={{ fontStyle: 'italic' }}>Press a button to execute a batched query.</span>
          </div>
        )}
        {state.status === 'loading' && (
          <div className="output">
            <span className="out-loading">Fetching…</span>
          </div>
        )}
        {state.status === 'error' && (
          <div className="output">
            <span className="out-error">Error: {state.error}</span>
          </div>
        )}
        {state.status === 'success' && state.results && (
          <div className="batch-results">
            <div className="sub-panel">
              <div className="sub-panel-title">Op 1 — All Series</div>
              <ResultTable rows={seriesRows} columns={['name', 'abbreviation', 'episodes']} />
            </div>
            <div className="sub-panel">
              <div className="sub-panel-title">Op 2 — TNG Season 2</div>
              <ResultTable rows={tngRows} columns={['id', 'title', 'airDate', 'episodeNumber']} />
            </div>
            <div className="sub-panel">
              <div className="sub-panel-title">Op 3 — Episode #1</div>
              <ResultTable
                rows={episodeRow}
                columns={['id', 'title', 'airDate', 'imdbRating', 'series']}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
