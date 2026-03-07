import { useState } from 'react'

import { postClient } from '../apollo'
import { ADD_FAVORITE_MUTATION } from '../operations'
import type { FavoriteEpisode } from '../types'
import { ResultTable } from '../utils'

type State = {
  status: 'idle' | 'loading' | 'success' | 'error'
  favorites: FavoriteEpisode[]
  error: string | null
}

const COLUMNS = ['id', 'title', 'season', 'episodeNumber', 'airDate']

export function FavoriteSection() {
  const [episodeId, setEpisodeId] = useState('')
  const [state, setState] = useState<State>({ status: 'idle', favorites: [], error: null })

  async function addFavorite() {
    const id = parseInt(episodeId, 10)
    if (!id || id < 1) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: 'Please enter a valid episode ID (positive integer)',
      }))
      return
    }
    setState((s) => ({ ...s, status: 'loading', error: null }))
    try {
      const result = await postClient.mutate({
        mutation: ADD_FAVORITE_MUTATION,
        variables: { id },
      })
      setState({
        status: 'success',
        favorites: (result.data as any)?.addFavoriteEpisode ?? [],
        error: null,
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
    <section className="card card-full">
      <div className="card-header">
        <span className="badge badge-mut">Mutation</span>
        <h2>Add Favorite Episode</h2>
      </div>
      <div className="card-body">
        <div className="input-row">
          <label htmlFor="fav-id">Episode ID:</label>
          <input
            id="fav-id"
            type="number"
            value={episodeId}
            placeholder="e.g. 42"
            min={1}
            style={{ width: '120px' }}
            onChange={(e) => setEpisodeId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFavorite()}
            disabled={state.status === 'loading'}
          />
          <button
            className="btn btn-mut"
            onClick={addFavorite}
            disabled={state.status === 'loading'}
          >
            Add Favorite
          </button>
        </div>

        <div className="output output-has-content">
          {state.status === 'idle' && (
            <span className="out-loading" style={{ fontStyle: 'italic' }}>
              Enter an episode ID and click Add Favorite.
            </span>
          )}
          {state.status === 'loading' && <span className="out-loading">Saving…</span>}
          {state.status === 'error' && <span className="out-error">Error: {state.error}</span>}
          {state.status === 'success' && (
            <>
              <p className="out-total">
                {state.favorites.length} favorite{state.favorites.length !== 1 ? 's' : ''}
              </p>
              <ResultTable rows={state.favorites} columns={COLUMNS} />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
