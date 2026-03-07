import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SeriesSection } from '../SeriesSection'

vi.mock('../../apollo', () => ({
  postClient: { query: vi.fn() },
  getClient: { query: vi.fn() },
}))

import { getClient, postClient } from '../../apollo'

const mockData = {
  series: {
    totalCount: 2,
    edges: [
      {
        node: {
          id: '1',
          name: 'The Original Series',
          abbreviation: 'TOS',
          startYear: 1966,
          endYear: 1969,
          numSeasons: 3,
          episodes: { totalCount: 79 },
        },
      },
      {
        node: {
          id: '2',
          name: 'The Next Generation',
          abbreviation: 'TNG',
          startYear: 1987,
          endYear: 1994,
          numSeasons: 7,
          episodes: { totalCount: 178 },
        },
      },
    ],
  },
}

describe('SeriesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders idle state', () => {
    render(<SeriesSection />)
    expect(screen.getByText(/Press a button/)).toBeInTheDocument()
  })

  it('POST button queries via postClient and renders results', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.query).mockResolvedValue({ data: mockData } as never)

    render(<SeriesSection />)
    await user.click(screen.getByText('POST /graphql'))

    expect(postClient.query).toHaveBeenCalledWith(
      expect.objectContaining({ fetchPolicy: 'no-cache' })
    )

    await waitFor(() => {
      expect(screen.getByText('The Original Series')).toBeInTheDocument()
      expect(screen.getByText('The Next Generation')).toBeInTheDocument()
    })

    expect(screen.getByText('2 series total')).toBeInTheDocument()
  })

  it('GET button queries via getClient and renders results', async () => {
    const user = userEvent.setup()
    vi.mocked(getClient.query).mockResolvedValue({ data: mockData } as never)

    render(<SeriesSection />)
    await user.click(screen.getByText('GET /graphql'))

    expect(getClient.query).toHaveBeenCalledWith(
      expect.objectContaining({ fetchPolicy: 'no-cache' })
    )

    await waitFor(() => {
      expect(screen.getByText('The Original Series')).toBeInTheDocument()
    })
  })

  it('displays non-Error rejection as string', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.query).mockRejectedValue('server unavailable')

    render(<SeriesSection />)
    await user.click(screen.getByText('POST /graphql'))

    await waitFor(() => {
      expect(screen.getByText(/server unavailable/)).toBeInTheDocument()
    })
  })

  it('shows error message on query failure', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.query).mockRejectedValue(new Error('Network error'))

    render(<SeriesSection />)
    await user.click(screen.getByText('POST /graphql'))

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument()
    })
  })

  it('handles missing series data gracefully', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.query).mockResolvedValue({ data: {} } as never)

    render(<SeriesSection />)
    await user.click(screen.getByText('POST /graphql'))

    await waitFor(() => {
      expect(screen.getByText('0 series total')).toBeInTheDocument()
    })
  })

  it('disables buttons while loading', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.query).mockImplementation(() => new Promise(() => {}))

    render(<SeriesSection />)
    await user.click(screen.getByText('POST /graphql'))

    expect(screen.getByText('POST /graphql')).toBeDisabled()
    expect(screen.getByText('GET /graphql')).toBeDisabled()
  })
})
