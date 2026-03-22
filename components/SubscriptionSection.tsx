import { useEffect, useRef, useState } from 'react'

import { sseClient, wsClient } from '@/lib/apollo'
import { RANDOM_EPISODES_SUB, RANDOM_EPISODES_SUB_STR } from '@/lib/operations'
import type { EpisodeNode } from '@/lib/types'

type Status = 'idle' | 'connecting' | 'active' | 'done' | 'error'

const STATUS_LABELS: Record<Status, string> = {
  idle: '',
  connecting: 'connecting…',
  active: 'receiving',
  done: 'complete',
  error: 'error',
}

export function SubscriptionSection() {
  const [status, setStatus] = useState<Status>('idle')
  const [episodes, setEpisodes] = useState<EpisodeNode[]>([])
  const [count, setCount] = useState(5)
  const [subError, setSubError] = useState<string | null>(null)

  const wsSubRef = useRef<{ unsubscribe: () => void } | null>(null)
  const sseUnsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      wsSubRef.current?.unsubscribe()
      sseUnsubRef.current?.()
    }
  }, [])

  function stopAll() {
    wsSubRef.current?.unsubscribe()
    wsSubRef.current = null
    sseUnsubRef.current?.()
    sseUnsubRef.current = null
  }

  function startWs() {
    stopAll()
    setEpisodes([])
    setSubError(null)
    setStatus('connecting')

    const observable = wsClient.subscribe<{ randomEpisode: EpisodeNode }>({
      query: RANDOM_EPISODES_SUB,
      variables: { count },
    })

    const sub = observable.subscribe({
      next(result) {
        const ep = result.data?.randomEpisode
        if (ep) {
          setEpisodes((prev) => [...prev, ep])
          setStatus('active')
        }
      },
      error(err: unknown) {
        setStatus('error')
        setSubError(err instanceof Error ? err.message : String(err))
        wsSubRef.current = null
      },
      complete() {
        setStatus('done')
        wsSubRef.current = null
      },
    })

    wsSubRef.current = sub
  }

  function startSse() {
    stopAll()
    setEpisodes([])
    setSubError(null)
    setStatus('connecting')

    const unsub = sseClient.subscribe(
      { query: RANDOM_EPISODES_SUB_STR, variables: { count } },
      {
        next: (result: { data?: { randomEpisode?: EpisodeNode } }) => {
          const ep = result?.data?.randomEpisode
          if (ep) {
            setEpisodes((prev) => [...prev, ep])
            setStatus('active')
          }
        },
        error: (err: unknown) => {
          setStatus('error')
          setSubError(err instanceof Error ? err.message : String(err))
          sseUnsubRef.current = null
        },
        complete: () => {
          setStatus('done')
          sseUnsubRef.current = null
        },
      }
    )

    sseUnsubRef.current = unsub
  }

  function stop() {
    stopAll()
    setStatus('done')
  }

  const isRunning = status === 'connecting' || status === 'active'

  return (
    <section className="card card-full">
      <div className="card-header">
        <span className="badge badge-sub">Subscription</span>
        <h2>Random Episodes</h2>
        {status !== 'idle' && (
          <span className={`sub-status sub-status-${status}`}>{STATUS_LABELS[status]}</span>
        )}
      </div>
      <div className="card-body">
        <div className="controls">
          <button className="btn btn-ws" onClick={startWs} disabled={isRunning}>
            WebSocket
          </button>
          <button className="btn btn-sse" onClick={startSse} disabled={isRunning}>
            SSE
          </button>
          <button className="btn btn-stop" onClick={stop} disabled={!isRunning}>
            Stop
          </button>
          <label style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Count:
            <input
              type="number"
              value={count}
              min={1}
              max={100}
              style={{ width: '70px' }}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              disabled={isRunning}
            />
          </label>
        </div>

        <div className="output output-has-content" style={{ maxHeight: '480px' }}>
          {status === 'idle' && (
            <span className="out-loading" style={{ fontStyle: 'italic' }}>
              Start a subscription to receive random episodes (one every 3 seconds).
            </span>
          )}
          {status === 'connecting' && episodes.length === 0 && (
            <span className="out-loading">Connecting…</span>
          )}
          {episodes.length > 0 && (
            <div className="episodes-list">
              {episodes.map((ep, i) => (
                <div key={i} className="episode-card">
                  <div className="episode-card-title">{ep.title}</div>
                  <div className="episode-card-meta">
                    S{ep.season ?? '?'}E{ep.episodeNumber ?? '?'} &middot; {ep.airDate ?? '?'}{' '}
                    &middot; ★ {ep.imdbRating ?? '?'}
                  </div>
                  {ep.series && (
                    <div className="episode-card-series">
                      {ep.series.name}{' '}
                      <span style={{ color: 'var(--dim)' }}>({ep.series.abbreviation})</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {status === 'error' && <span className="out-error">Subscription error: {subError}</span>}
        </div>
      </div>
    </section>
  )
}
