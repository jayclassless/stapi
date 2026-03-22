import { readFileSync } from 'fs'
import { join } from 'path'

import { Actor } from '../actors/actor.model.js'
import { Character } from '../characters/character.model.js'
import { Episode } from '../episodes/episode.model.js'
import { Organization } from '../organizations/organization.model.js'
import { Series } from '../series/series.model.js'
import { Ship } from '../ships/ship.model.js'
import { Species } from '../species/species.model.js'

export interface TableTypeMap {
  Series: Series
  Episodes: Episode
  Characters: Character
  Actors: Actor
  Species: Species
  Ships: Ship
  Organizations: Organization
}

export type TableName = keyof TableTypeMap

export type JunctionName = 'Character_Episodes' | 'Character_Actors' | 'Character_Organizations'

const PK_COLUMNS: Record<TableName, string> = {
  Series: 'series_id',
  Episodes: 'episode_id',
  Characters: 'character_id',
  Actors: 'actor_id',
  Species: 'species_id',
  Ships: 'ship_id',
  Organizations: 'organization_id',
}

const JUNCTION_KEYS: Record<JunctionName, [string, string]> = {
  Character_Episodes: ['character_id', 'episode_id'],
  Character_Actors: ['character_id', 'actor_id'],
  Character_Organizations: ['character_id', 'organization_id'],
}

export class DatabaseService {
  private collections = new Map<string, unknown[]>()
  private pkMaps = new Map<string, Map<number, unknown>>()
  private junctionIndexes = new Map<string, Map<number, Set<number>>>()

  init() {
    const dataDir = join(process.cwd(), 'data')

    for (const table of Object.keys(PK_COLUMNS) as TableName[]) {
      const rows = JSON.parse(
        readFileSync(join(dataDir, `${table.toLowerCase()}.json`), 'utf-8')
      ) as Record<string, unknown>[]
      this.collections.set(table, rows)
      const pk = PK_COLUMNS[table]
      this.pkMaps.set(table, new Map(rows.map((r) => [r[pk] as number, r])))
    }

    for (const junction of Object.keys(JUNCTION_KEYS) as JunctionName[]) {
      const rows = JSON.parse(
        readFileSync(join(dataDir, `${junction.toLowerCase()}.json`), 'utf-8')
      ) as Record<string, unknown>[]
      const [fk1, fk2] = JUNCTION_KEYS[junction]
      const index1 = new Map<number, Set<number>>()
      const index2 = new Map<number, Set<number>>()
      for (const row of rows) {
        const v1 = row[fk1] as number
        const v2 = row[fk2] as number
        if (!index1.has(v1)) index1.set(v1, new Set())
        index1.get(v1)!.add(v2)
        if (!index2.has(v2)) index2.set(v2, new Set())
        index2.get(v2)!.add(v1)
      }
      this.junctionIndexes.set(`${junction}:${fk1}`, index1)
      this.junctionIndexes.set(`${junction}:${fk2}`, index2)
    }
  }

  getAll<K extends TableName>(table: K): TableTypeMap[K][] {
    return (this.collections.get(table) ?? []) as TableTypeMap[K][]
  }

  getById<K extends TableName>(table: K, id: number): TableTypeMap[K] | undefined {
    return this.pkMaps.get(table)?.get(id) as TableTypeMap[K] | undefined
  }

  getByIds<K extends TableName>(table: K, ids: number[]): TableTypeMap[K][] {
    const map = this.pkMaps.get(table)
    if (!map) return []
    return ids.flatMap((id) => {
      const row = map.get(id)
      return row ? [row as TableTypeMap[K]] : []
    })
  }

  getRelatedIds(junction: JunctionName, foreignKey: string, id: number): number[] {
    const index = this.junctionIndexes.get(`${junction}:${foreignKey}`)
    if (!index) return []
    const set = index.get(id)
    return set ? [...set] : []
  }

  count(table: TableName): number {
    return (this.collections.get(table) ?? []).length
  }
}
