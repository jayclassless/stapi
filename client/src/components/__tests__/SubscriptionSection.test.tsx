import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SubscriptionSection } from '../SubscriptionSection'

vi.mock('../../apollo', () => ({
  wsClient: { subscribe: vi.fn() },
  sseClient: { subscribe: vi.fn() },
}))

import { sseClient, wsClient } from '../../apollo'

const mockEpisode = {
  id: '42',
  title: 'The Inner Light',
  season: 5,
  episodeNumber: 25,
  airDate: '1992-06-01',
  imdbRating: 9.7,
  series: { name: 'The Next Generation', abbreviation: 'TNG' },
}

describe('SubscriptionSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders idle state with default count of 5', () => {
    render(<SubscriptionSection />)
    expect(screen.getByText(/Start a subscription/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it('WebSocket button starts subscription with correct variables and shows episodes', async () => {
    const user = userEvent.setup()
    const mockUnsubscribe = vi.fn()

    vi.mocked(wsClient.subscribe).mockReturnValue({
      subscribe: vi.fn((observer) => {
        Promise.resolve().then(() => {
          observer.next({ data: { randomEpisode: mockEpisode } })
        })
        return { unsubscribe: mockUnsubscribe, closed: false }
      }),
    } as never)

    render(<SubscriptionSection />)
    await user.click(screen.getByText('WebSocket'))

    expect(wsClient.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { count: 5 } })
    )

    await waitFor(() => {
      expect(screen.getByText('The Inner Light')).toBeInTheDocument()
    })

    expect(screen.getByText(/S5E25/)).toBeInTheDocument()
  })

  it('Stop button unsubscribes from WebSocket', async () => {
    const user = userEvent.setup()
    const mockUnsubscribe = vi.fn()

    vi.mocked(wsClient.subscribe).mockReturnValue({
      subscribe: vi.fn((_observer) => {
        return { unsubscribe: mockUnsubscribe, closed: false }
      }),
    } as never)

    render(<SubscriptionSection />)
    await user.click(screen.getByText('WebSocket'))
    await user.click(screen.getByText('Stop'))

    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('SSE button starts subscription and shows episodes', async () => {
    const user = userEvent.setup()

    vi.mocked(sseClient.subscribe).mockImplementation((_payload, sink) => {
      Promise.resolve().then(() => {
        ;(sink as { next: (d: unknown) => void }).next({ data: { randomEpisode: mockEpisode } })
      })
      return vi.fn()
    })

    render(<SubscriptionSection />)
    await user.click(screen.getByText('SSE'))

    expect(sseClient.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { count: 5 } }),
      expect.objectContaining({ next: expect.any(Function) })
    )

    await waitFor(() => {
      expect(screen.getByText('The Inner Light')).toBeInTheDocument()
    })
  })

  it('SSE stop calls unsubscribe function', async () => {
    const user = userEvent.setup()
    const mockUnsub = vi.fn()

    vi.mocked(sseClient.subscribe).mockImplementation((_payload, _sink) => mockUnsub)

    render(<SubscriptionSection />)
    await user.click(screen.getByText('SSE'))
    await user.click(screen.getByText('Stop'))

    expect(mockUnsub).toHaveBeenCalled()
  })

  it('uses updated count value in subscription', async () => {
    const user = userEvent.setup()
    const mockUnsubscribe = vi.fn()

    vi.mocked(wsClient.subscribe).mockReturnValue({
      subscribe: vi.fn((_observer) => ({ unsubscribe: mockUnsubscribe, closed: false })),
    } as never)

    render(<SubscriptionSection />)

    fireEvent.change(screen.getByDisplayValue('5'), { target: { value: '3' } })

    await act(async () => {
      await user.click(screen.getByText('WebSocket'))
    })

    expect(wsClient.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { count: 3 } })
    )
  })

  it('sets done status when WebSocket subscription completes', async () => {
    const user = userEvent.setup()

    vi.mocked(wsClient.subscribe).mockReturnValue({
      subscribe: vi.fn((observer) => {
        Promise.resolve().then(() => observer.complete())
        return { unsubscribe: vi.fn(), closed: false }
      }),
    } as never)

    render(<SubscriptionSection />)
    await user.click(screen.getByText('WebSocket'))

    await waitFor(() => {
      expect(screen.getByText('complete')).toBeInTheDocument()
    })
  })

  it('sets done status when SSE subscription completes', async () => {
    const user = userEvent.setup()

    vi.mocked(sseClient.subscribe).mockImplementation((_payload, sink) => {
      Promise.resolve().then(() => {
        ;(sink as { complete: () => void }).complete()
      })
      return vi.fn()
    })

    render(<SubscriptionSection />)
    await user.click(screen.getByText('SSE'))

    await waitFor(() => {
      expect(screen.getByText('complete')).toBeInTheDocument()
    })
  })

  it('ignores WS next events with no episode in data', async () => {
    const user = userEvent.setup()

    vi.mocked(wsClient.subscribe).mockReturnValue({
      subscribe: vi.fn((observer) => {
        Promise.resolve().then(() => observer.next({ data: {} }))
        return { unsubscribe: vi.fn(), closed: false }
      }),
    } as never)

    render(<SubscriptionSection />)
    await user.click(screen.getByText('WebSocket'))

    await waitFor(() => {
      expect(screen.getByText('connecting…')).toBeInTheDocument()
      expect(screen.queryByText('receiving')).not.toBeInTheDocument()
    })
  })

  it('ignores SSE next events with no episode in data', async () => {
    const user = userEvent.setup()

    vi.mocked(sseClient.subscribe).mockImplementation((_payload, sink) => {
      Promise.resolve().then(() => {
        ;(sink as { next: (d: unknown) => void }).next({ data: {} })
      })
      return vi.fn()
    })

    render(<SubscriptionSection />)
    await user.click(screen.getByText('SSE'))

    await waitFor(() => {
      expect(screen.getByText('connecting…')).toBeInTheDocument()
      expect(screen.queryByText('receiving')).not.toBeInTheDocument()
    })
  })

  it('shows error message when WebSocket subscription errors with an Error', async () => {
    const user = userEvent.setup()

    vi.mocked(wsClient.subscribe).mockReturnValue({
      subscribe: vi.fn((observer) => {
        Promise.resolve().then(() => observer.error(new Error('Connection refused')))
        return { unsubscribe: vi.fn(), closed: false }
      }),
    } as never)

    render(<SubscriptionSection />)
    await user.click(screen.getByText('WebSocket'))

    await waitFor(() => {
      expect(screen.getByText(/Connection refused/)).toBeInTheDocument()
    })
  })

  it('shows stringified error when WS error is not an Error instance', async () => {
    const user = userEvent.setup()

    vi.mocked(wsClient.subscribe).mockReturnValue({
      subscribe: vi.fn((observer) => {
        Promise.resolve().then(() => observer.error('connection timeout'))
        return { unsubscribe: vi.fn(), closed: false }
      }),
    } as never)

    render(<SubscriptionSection />)
    await user.click(screen.getByText('WebSocket'))

    await waitFor(() => {
      expect(screen.getByText(/connection timeout/)).toBeInTheDocument()
    })
  })

  it('shows error message when SSE subscription errors with an Error', async () => {
    const user = userEvent.setup()

    vi.mocked(sseClient.subscribe).mockImplementation((_payload, sink) => {
      Promise.resolve().then(() => {
        ;(sink as { error: (e: unknown) => void }).error(new Error('SSE failed'))
      })
      return vi.fn()
    })

    render(<SubscriptionSection />)
    await user.click(screen.getByText('SSE'))

    await waitFor(() => {
      expect(screen.getByText(/SSE failed/)).toBeInTheDocument()
    })
  })

  it('shows stringified error when SSE error is not an Error instance', async () => {
    const user = userEvent.setup()

    vi.mocked(sseClient.subscribe).mockImplementation((_payload, sink) => {
      Promise.resolve().then(() => {
        ;(sink as { error: (e: unknown) => void }).error('sse timeout')
      })
      return vi.fn()
    })

    render(<SubscriptionSection />)
    await user.click(screen.getByText('SSE'))

    await waitFor(() => {
      expect(screen.getByText(/sse timeout/)).toBeInTheDocument()
    })
  })

  it('renders episode card without series section when series is absent', async () => {
    const user = userEvent.setup()
    const episodeNoSeries = { ...mockEpisode, series: undefined }

    vi.mocked(wsClient.subscribe).mockReturnValue({
      subscribe: vi.fn((observer) => {
        Promise.resolve().then(() => observer.next({ data: { randomEpisode: episodeNoSeries } }))
        return { unsubscribe: vi.fn(), closed: false }
      }),
    } as never)

    render(<SubscriptionSection />)
    await user.click(screen.getByText('WebSocket'))

    await waitFor(() => {
      expect(screen.getByText('The Inner Light')).toBeInTheDocument()
    })
    expect(screen.queryByText(/The Next Generation/)).not.toBeInTheDocument()
  })

  it('renders "?" placeholders for null episode fields', async () => {
    const user = userEvent.setup()
    const nullFieldEpisode = {
      id: '1',
      title: 'Sparse Episode',
      season: null,
      episodeNumber: null,
      airDate: null,
      imdbRating: null,
      series: null,
    }

    vi.mocked(wsClient.subscribe).mockReturnValue({
      subscribe: vi.fn((observer) => {
        Promise.resolve().then(() => observer.next({ data: { randomEpisode: nullFieldEpisode } }))
        return { unsubscribe: vi.fn(), closed: false }
      }),
    } as never)

    render(<SubscriptionSection />)
    await user.click(screen.getByText('WebSocket'))

    await waitFor(() => {
      expect(screen.getByText('Sparse Episode')).toBeInTheDocument()
    })
    expect(screen.getByText(/S\?E\?/)).toBeInTheDocument()
  })

  it('clamps count to 1 when input is cleared', () => {
    render(<SubscriptionSection />)
    fireEvent.change(screen.getByDisplayValue('5'), { target: { value: '' } })
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()
  })

  it('disables start buttons while subscription is running', async () => {
    const user = userEvent.setup()

    vi.mocked(wsClient.subscribe).mockReturnValue({
      subscribe: vi.fn((_observer) => ({ unsubscribe: vi.fn(), closed: false })),
    } as never)

    render(<SubscriptionSection />)
    await user.click(screen.getByText('WebSocket'))

    expect(screen.getByText('WebSocket')).toBeDisabled()
    expect(screen.getByText('SSE')).toBeDisabled()
    expect(screen.getByText('Stop')).not.toBeDisabled()
  })
})
