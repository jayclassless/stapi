import { join } from 'path'

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import Database from 'better-sqlite3'

export type SqlParam = string | number | bigint | boolean | null | Buffer

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database.Database

  onModuleInit() {
    this.db = new Database(join(process.cwd(), 'startrek.db'), { readonly: true })
  }

  onModuleDestroy() {
    this.db?.close()
  }

  query<T>(sql: string, params: SqlParam[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[]
  }

  queryOne<T>(sql: string, params: SqlParam[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined
  }

  count(sql: string, params: SqlParam[] = []): number {
    const row = this.db.prepare(sql).get(...params) as { count: number }
    return row?.count ?? 0
  }
}
