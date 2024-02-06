import { SelectUsers, InsertUsers, users } from '../db/schema';
import { db as DB } from '../utils/db';
export class DuelSQLRepository {
  constructor(private db: typeof DB) {}

  async getUsers(): Promise<any> {
    this.db.select().from(users);
  }

  async putUsers(): Promise<any> {
    this.db.insert(users).values([
      {
        id: '1234',
        gamesWon: 1,
        gamesLost: 1,
      },
    ]);
  }
}
