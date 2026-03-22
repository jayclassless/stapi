import { writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Export SQLite database to JSON files.
 *
 * Usage:
 *   npx tsx scripts/export-data.ts
 *
 * Requires `better-sqlite3` to be installed (add it temporarily if needed):
 *   pnpm add -D better-sqlite3 @types/better-sqlite3
 *
 * Reads `startrek.db` from the project root and writes one JSON file per table
 * into the `data/` directory. Each file contains a sorted array of row objects.
 */
import Database from 'better-sqlite3'

const db = new Database(join(process.cwd(), 'startrek.db'), { readonly: true })
const dataDir = join(process.cwd(), 'data')

const tables: { name: string; pk: string }[] = [
  { name: 'Series', pk: 'series_id' },
  { name: 'Episodes', pk: 'episode_id' },
  { name: 'Characters', pk: 'character_id' },
  { name: 'Actors', pk: 'actor_id' },
  { name: 'Species', pk: 'species_id' },
  { name: 'Ships', pk: 'ship_id' },
  { name: 'Organizations', pk: 'organization_id' },
  { name: 'Character_Episodes', pk: 'char_episode_id' },
  { name: 'Character_Actors', pk: 'character_actor_id' },
  { name: 'Character_Organizations', pk: 'char_org_id' },
]

for (const { name, pk } of tables) {
  let rows = db.prepare(`SELECT * FROM ${name} ORDER BY ${pk} ASC`).all() as Record<
    string,
    unknown
  >[]

  // Convert warp_capable from 0/1 to boolean
  if (name === 'Species') {
    rows = rows.map((r) => ({ ...r, warp_capable: Boolean(r.warp_capable) }))
  }

  // Drop created_at/updated_at columns — not used by the app
  rows = rows.map(({ created_at: _, updated_at: __, ...rest }) => rest)

  const file = join(dataDir, `${name.toLowerCase()}.json`)
  writeFileSync(file, JSON.stringify(rows, null, 2) + '\n')
  console.log(`${name}: ${rows.length} rows → ${file}`)
}

db.close()
console.log('Done!')
