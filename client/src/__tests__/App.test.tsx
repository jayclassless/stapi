import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { App } from '../App'

vi.mock('../apollo', () => ({
  postClient: { query: vi.fn(), mutate: vi.fn() },
  getClient: { query: vi.fn() },
  wsClient: { subscribe: vi.fn() },
  sseClient: { subscribe: vi.fn() },
}))

describe('App', () => {
  it('renders header and all five sections', () => {
    render(<App />)
    expect(screen.getByText('STAPI')).toBeInTheDocument()
    expect(screen.getByText('All Star Trek Series')).toBeInTheDocument()
    expect(screen.getByText('TNG — Season 2 Episodes')).toBeInTheDocument()
    expect(screen.getByText('Batched Query')).toBeInTheDocument()
    expect(screen.getByText('Random Episodes')).toBeInTheDocument()
    expect(screen.getByText('Add Favorite Episode')).toBeInTheDocument()
  })
})
