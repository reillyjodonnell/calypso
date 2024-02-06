import { users } from '../db/schema';
import { db as DB } from '../utils/db';

export class DuelSQLRepository {
  constructor(private db: typeof DB) {}

  async getUsers(): Promise<any> {
    return this.db.select().from(users);
  }

  async putUsers(userData: {
    id: string;
    gamesWon: number;
    gamesLost: number;
  }): Promise<any> {
    const userExists = await this.userExists(userData.id);
    const currentGamesWon = await this.getCurrentGamesWon(userData.id);
    const currentGamesLost = await this.getCurrentGamesLost(userData.id);

    if (userExists) {
      // If user exists, update gamesWon and gamesLost
      await this.db
        .update(users)
        .set({ gamesWon: currentGamesWon + 1, gamesLost: userData.gamesLost })
        .where({ id: userData.id } as any)
        .execute();
    } else {
      // If user doesn't exist, insert a new row
      await this.db.insertInto(users).values(userData).execute();
    }
  }

  private async userExists(userId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(users)
      .where({ id: userId } as any)
      .limit(1);
    return result.length > 0;
  }

  private async getCurrentGamesWon(userId: string): Promise<number> {
    const result = await this.db
      .select('gamesWon')
      .from(users)
      .where({ id: userId })
      .limit(1);
    return result.length > 0 ? result[0].gamesWon : 0;
  }

  private async getCurrentGamesLost(userId: string): Promise<number> {
    const result = await this.db
      .select('gamesLost')
      .from(users)
      .where({ id: userId })
      .limit(1);
    return result.length > 0 ? result[0].gamesLost : 0;
  }
}
