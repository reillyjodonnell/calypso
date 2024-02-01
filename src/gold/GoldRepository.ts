import { RedisClientType } from 'redis';

export interface GoldRepositoryInterface {
  awardGold(playerId: string, amount: number): Promise<void>;
  spendGold(playerId: string, amount: number): Promise<boolean>;
  getGold(playerId: string): Promise<number>;
}

export class GoldRepository implements GoldRepositoryInterface {
  constructor(private redisClient: RedisClientType) {}

  async awardGold(playerId: string, amount: number): Promise<void> {
    await this.redisClient.incrBy(`user:${playerId}:gold`, amount);
  }

  async spendGold(playerId: string, amount: number): Promise<boolean> {
    // Start a watch on the gold key
    await this.redisClient.watch(`user:${playerId}:gold`);

    // Get the current gold value
    const currentGold = await this.getGold(playerId);

    if (amount > currentGold) {
      // If not enough gold, cancel the transaction
      await this.redisClient.unwatch();
      return false;
    }

    // If enough gold, proceed with the transaction
    const result = await this.redisClient
      .multi()
      .decrBy(`user:${playerId}:gold`, amount)
      .exec();

    // If the transaction failed (e.g., key was modified by another client), result will be null
    return result !== null;
  }

  async getGold(playerId: string): Promise<number> {
    let gold = await this.redisClient.get(`user:${playerId}:gold`);

    if (gold === null) {
      // Set the default value if it does not exist
      await this.redisClient.set(`user:${playerId}:gold`, '0');
      gold = '0';
    }

    return parseInt(gold);
  }
}
