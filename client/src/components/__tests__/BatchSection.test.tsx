import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BatchSection } from '../BatchSection'

// BatchSection uses fetch directly, no Apollo client mock needed.

const mockFetchResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response)

const seriesResult = {
  data: {
    series: {
      totalCount: 2,
      edges: [
        { node: { id: '1', name: 'TOS', abbreviation: 'TOS', episodes: { totalCount: 79 } } },
        { node: { id: '2', name: 'TNG', abbreviation: 'TNG', episodes: { totalCount: 178 } } },
      ],
    },
  },
}

const tngResult = {
  data: {
    seriesById: {
      name: 'The Next Generation',
      episodes: {
        totalCount: 22,
        edges: [
          {
            node: {
              id: '42',
              title: 'The Measure of a Man',
              airDate: '1989-02-13',
              episodeNumber: 9,
            },
          },
        ],
      },
    },
  },
}

const episodeResult = {
  data: {
    episode: {
      id: '1',
      title: 'The Man Trap',
      airDate: '1966-09-08',
      imdbRating: 7.3,
      series: { name: 'TOS', abbreviation: 'TOS' },
    },
  },
}

describe('BatchSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders idle state', () => {
    render(<BatchSection />)
    expect(screen.getByText(/Press a button/)).toBeInTheDocument()
  })

  it('POST button sends array body with 3 operations and renders sub-panels', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(mockFetchResponse([seriesResult, tngResult, episodeResult]) as never)

    render(<BatchSection />)
    await user.click(screen.getByText('POST (batch array)'))

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/graphql')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body as string)
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(3)

    await waitFor(() => {
      expect(screen.getByText('Op 1 — All Series')).toBeInTheDocument()
      expect(screen.getByText('Op 2 — TNG Season 2')).toBeInTheDocument()
      expect(screen.getByText('Op 3 — Episode #1')).toBeInTheDocument()
    })

    expect(screen.getByText('The Measure of a Man')).toBeInTheDocument()
    expect(screen.getByText('The Man Trap')).toBeInTheDocument()
  })

  it('renders empty sub-panels when batch response has no nested data', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockFetchResponse([{ data: {} }, { data: {} }, { data: {} }]) as never
    )

    render(<BatchSection />)
    await user.click(screen.getByText('POST (batch array)'))

    await waitFor(() => {
      expect(screen.getByText('Op 1 — All Series')).toBeInTheDocument()
    })
    expect(screen.getAllByText('No results.')).toHaveLength(3)
  })

  it('shows error when response has non-ok status', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 500 } as Response)

    render(<BatchSection />)
    await user.click(screen.getByText('POST (batch array)'))

    await waitFor(() => {
      expect(screen.getByText(/HTTP 500/)).toBeInTheDocument()
    })
  })

  it('displays non-Error rejection as string', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue('timeout')

    render(<BatchSection />)
    await user.click(screen.getByText('POST (batch array)'))

    await waitFor(() => {
      expect(screen.getByText(/timeout/)).toBeInTheDocument()
    })
  })

  it('shows error on fetch failure', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    render(<BatchSection />)
    await user.click(screen.getByText('POST (batch array)'))

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument()
    })
  })
})
