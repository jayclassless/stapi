import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TngSection } from '@/components/TngSection'

vi.mock('@/lib/apollo', () => ({
  postClient: { query: vi.fn() },
  getClient: { query: vi.fn() },
  apqPostClient: { query: vi.fn() },
  apqGetClient: { query: vi.fn() },
}))

import { apqGetClient, apqPostClient, getClient, postClient } from '@/lib/apollo'

const mockEpisode = {
  id: '42',
  title: 'The Measure of a Man',
  episodeNumber: 9,
  airDate: '1989-02-13',
  imdbRating: 9.0,
  description: 'Picard defends Data.',
}

const mockData = {
  seriesById: {
    name: 'The Next Generation',
    episodes: {
      totalCount: 22,
      edges: [{ node: mockEpisode }],
    },
  },
}

describe('TngSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders idle state', () => {
    render(<TngSection />)
    expect(screen.getByText(/Press a button/)).toBeInTheDocument()
  })

  it('POST button passes correct variables and renders results', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.query).mockResolvedValue({ data: mockData } as never)

    render(<TngSection />)
    await user.click(screen.getByText('POST /graphql'))

    expect(postClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { abbreviation: 'TNG', season: 2 },
        fetchPolicy: 'no-cache',
      })
    )

    await waitFor(() => {
      expect(screen.getByText('The Measure of a Man')).toBeInTheDocument()
    })

    expect(screen.getByText('22 episodes')).toBeInTheDocument()
  })

  it('GET button passes correct variables', async () => {
    const user = userEvent.setup()
    vi.mocked(getClient.query).mockResolvedValue({ data: mockData } as never)

    render(<TngSection />)
    await user.click(screen.getByText('GET /graphql'))

    expect(getClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { abbreviation: 'TNG', season: 2 },
        fetchPolicy: 'no-cache',
      })
    )

    await waitFor(() => {
      expect(screen.getByText('The Measure of a Man')).toBeInTheDocument()
    })
  })

  it('handles missing episode data gracefully', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.query).mockResolvedValue({ data: {} } as never)

    render(<TngSection />)
    await user.click(screen.getByText('POST /graphql'))

    await waitFor(() => {
      expect(screen.getByText('0 episodes')).toBeInTheDocument()
    })
  })

  it('displays non-Error rejection as string', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.query).mockRejectedValue('timeout')

    render(<TngSection />)
    await user.click(screen.getByText('POST /graphql'))

    await waitFor(() => {
      expect(screen.getByText(/timeout/)).toBeInTheDocument()
    })
  })

  it('shows error message on failure', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.query).mockRejectedValue(new Error('Query failed'))

    render(<TngSection />)
    await user.click(screen.getByText('POST /graphql'))

    await waitFor(() => {
      expect(screen.getByText(/Query failed/)).toBeInTheDocument()
    })
  })

  it('APQ POST button queries via apqPostClient', async () => {
    const user = userEvent.setup()
    vi.mocked(apqPostClient.query).mockResolvedValue({ data: mockData } as never)

    render(<TngSection />)
    await user.click(screen.getByText('APQ POST /graphql'))

    expect(apqPostClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { abbreviation: 'TNG', season: 2 },
        fetchPolicy: 'no-cache',
      })
    )

    await waitFor(() => {
      expect(screen.getByText('The Measure of a Man')).toBeInTheDocument()
    })
  })

  it('APQ GET button queries via apqGetClient', async () => {
    const user = userEvent.setup()
    vi.mocked(apqGetClient.query).mockResolvedValue({ data: mockData } as never)

    render(<TngSection />)
    await user.click(screen.getByText('APQ GET /graphql'))

    expect(apqGetClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { abbreviation: 'TNG', season: 2 },
        fetchPolicy: 'no-cache',
      })
    )

    await waitFor(() => {
      expect(screen.getByText('The Measure of a Man')).toBeInTheDocument()
    })
  })
})
