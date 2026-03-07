import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Output, ResultTable } from '../utils'

describe('ResultTable', () => {
  it('shows "No results." for empty rows', () => {
    render(<ResultTable rows={[]} columns={['id']} />)
    expect(screen.getByText('No results.')).toBeInTheDocument()
  })

  it('renders string and number values', () => {
    render(<ResultTable rows={[{ id: '1', count: 79 }]} columns={['id', 'count']} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('79')).toBeInTheDocument()
  })

  it('renders null/undefined values as em-dash', () => {
    render(<ResultTable rows={[{ val: null }]} columns={['val']} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders { name: string, abbreviation: string } as "Name (ABBR)"', () => {
    const row = { series: { name: 'The Original Series', abbreviation: 'TOS' } }
    render(<ResultTable rows={[row]} columns={['series']} />)
    expect(screen.getByText('The Original Series (TOS)')).toBeInTheDocument()
  })

  it('renders { totalCount: number } as the count string', () => {
    const row = { episodes: { totalCount: 79 } }
    render(<ResultTable rows={[row]} columns={['episodes']} />)
    expect(screen.getByText('79')).toBeInTheDocument()
  })

  it('renders unknown objects as JSON', () => {
    const row = { meta: { foo: 'bar' } }
    render(<ResultTable rows={[row]} columns={['meta']} />)
    expect(screen.getByText('{"foo":"bar"}')).toBeInTheDocument()
  })
})

describe('Output', () => {
  it('renders "No data." when no children provided', () => {
    render(<Output />)
    expect(screen.getByText('No data.')).toBeInTheDocument()
  })

  it('renders custom empty prop when no children', () => {
    render(<Output empty="Nothing here yet" />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })

  it('renders children inside output-has-content div', () => {
    render(
      <Output>
        <span>hello world</span>
      </Output>
    )
    const el = screen.getByText('hello world')
    expect(el).toBeInTheDocument()
    expect(el.closest('.output-has-content')).toBeInTheDocument()
  })
})
