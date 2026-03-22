import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FavoriteSection } from '@/components/FavoriteSection'

vi.mock('@/lib/apollo', () => ({
  postClient: { query: vi.fn(), mutate: vi.fn() },
}))

import { postClient } from '@/lib/apollo'

const mockFavorites = [
  { id: '42', title: 'The Inner Light', airDate: '1992-06-01', season: 5, episodeNumber: 25 },
  {
    id: '15',
    title: 'The City on the Edge of Forever',
    airDate: '1967-04-06',
    season: 1,
    episodeNumber: 28,
  },
]

describe('FavoriteSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders idle state', () => {
    render(<FavoriteSection />)
    expect(screen.getByText(/Enter an episode ID/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. 42')).toBeInTheDocument()
  })

  it('shows error for empty input', async () => {
    const user = userEvent.setup()
    render(<FavoriteSection />)
    await user.click(screen.getByText('Add Favorite'))

    await waitFor(() => {
      expect(screen.getByText(/valid episode ID/)).toBeInTheDocument()
    })
  })

  it('shows error for zero or negative input', async () => {
    const user = userEvent.setup()
    render(<FavoriteSection />)

    await user.type(screen.getByPlaceholderText('e.g. 42'), '0')
    await user.click(screen.getByText('Add Favorite'))

    await waitFor(() => {
      expect(screen.getByText(/valid episode ID/)).toBeInTheDocument()
    })
  })

  it('calls mutation with correct id and renders favorites table', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.mutate).mockResolvedValue({
      data: { addFavoriteEpisode: mockFavorites },
    } as never)

    render(<FavoriteSection />)
    await user.type(screen.getByPlaceholderText('e.g. 42'), '42')
    await user.click(screen.getByText('Add Favorite'))

    expect(postClient.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 42 } })
    )

    await waitFor(() => {
      expect(screen.getByText('The Inner Light')).toBeInTheDocument()
      expect(screen.getByText('The City on the Edge of Forever')).toBeInTheDocument()
    })

    expect(screen.getByText('2 favorites')).toBeInTheDocument()
  })

  it('supports submitting via Enter key', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.mutate).mockResolvedValue({
      data: { addFavoriteEpisode: [mockFavorites[0]] },
    } as never)

    render(<FavoriteSection />)
    await user.type(screen.getByPlaceholderText('e.g. 42'), '42{Enter}')

    await waitFor(() => {
      expect(screen.getByText('The Inner Light')).toBeInTheDocument()
    })
  })

  it('displays non-Error rejection as string', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.mutate).mockRejectedValue('server error')

    render(<FavoriteSection />)
    await user.type(screen.getByPlaceholderText('e.g. 42'), '42')
    await user.click(screen.getByText('Add Favorite'))

    await waitFor(() => {
      expect(screen.getByText(/server error/)).toBeInTheDocument()
    })
  })

  it('shows error on mutation failure', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.mutate).mockRejectedValue(new Error('Episode not found'))

    render(<FavoriteSection />)
    await user.type(screen.getByPlaceholderText('e.g. 42'), '999')
    await user.click(screen.getByText('Add Favorite'))

    await waitFor(() => {
      expect(screen.getByText(/Episode not found/)).toBeInTheDocument()
    })
  })

  it('handles missing addFavoriteEpisode data gracefully', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.mutate).mockResolvedValue({ data: {} } as never)

    render(<FavoriteSection />)
    await user.type(screen.getByPlaceholderText('e.g. 42'), '42')
    await user.click(screen.getByText('Add Favorite'))

    await waitFor(() => {
      expect(screen.getByText('0 favorites')).toBeInTheDocument()
    })
  })

  it('shows singular "1 favorite" label', async () => {
    const user = userEvent.setup()
    vi.mocked(postClient.mutate).mockResolvedValue({
      data: { addFavoriteEpisode: [mockFavorites[0]] },
    } as never)

    render(<FavoriteSection />)
    await user.type(screen.getByPlaceholderText('e.g. 42'), '42')
    await user.click(screen.getByText('Add Favorite'))

    await waitFor(() => {
      expect(screen.getByText('1 favorite')).toBeInTheDocument()
    })
  })
})
