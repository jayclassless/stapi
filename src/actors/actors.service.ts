import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Actor, ActorConnection } from './actor.model';
import { PaginationInput } from '../common/pagination.input';
import { queryConnection } from '../common/cursor.helper';

@Injectable()
export class ActorsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(pagination: PaginationInput = {}): ActorConnection {
    return queryConnection<Actor>(this.db, 'SELECT * FROM Actors', [], 'actor_id', 'Actor', pagination);
  }

  findById(id: number): Actor | undefined {
    return this.db.queryOne<Actor>('SELECT * FROM Actors WHERE actor_id = ?', [id]);
  }

  findByCharacterId(characterId: number, pagination: PaginationInput = {}): ActorConnection {
    return queryConnection<Actor>(
      this.db,
      'SELECT a.* FROM Actors a JOIN Character_Actors ca ON ca.actor_id = a.actor_id WHERE ca.character_id = ?',
      [characterId],
      'actor_id',
      'Actor',
      pagination,
    );
  }
}
