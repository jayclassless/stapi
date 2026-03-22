import type { ReactNode } from 'react'

type RecordAny = Record<string, unknown>

function formatCell(value: unknown): ReactNode {
  if (value === null || value === undefined) {
    return <span style={{ color: 'var(--dim)' }}>—</span>
  }
  if (typeof value === 'object') {
    const obj = value as RecordAny
    // series: { name: string, abbreviation: string }
    if (typeof obj['name'] === 'string' && typeof obj['abbreviation'] === 'string') {
      return `${obj['name']} (${obj['abbreviation']})`
    }
    // episodes connection: { totalCount: number }
    if (typeof obj['totalCount'] === 'number') {
      return String(obj['totalCount'])
    }
    return JSON.stringify(obj)
  }
  return String(value)
}

export function ResultTable<T extends object>({ rows, columns }: { rows: T[]; columns: string[] }) {
  if (!rows.length) {
    return (
      <p style={{ color: 'var(--dim)', fontSize: '0.85rem', fontStyle: 'italic' }}>No results.</p>
    )
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c}>{formatCell((row as RecordAny)[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Output({ children, empty }: { children?: ReactNode; empty?: string }) {
  if (!children) {
    return <div className="output">{empty ?? 'No data.'}</div>
  }
  return <div className="output output-has-content">{children}</div>
}
