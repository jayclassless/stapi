import { join } from 'path'

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import Database from 'better-sqlite3'

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database.Database

  onModuleInit() {
    this.db = new Database(join(process.cwd(), 'startrek.db'), { readonly: true })
  }

  onModuleDestroy() {
    this.db?.close()
  }

  query<T>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[]
  }

  queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined
  }

  count(sql: string, params: unknown[] = []): number {
    const row = this.db.prepare(sql).get(...params) as { count: number }
    return row?.count ?? 0
  }
}
