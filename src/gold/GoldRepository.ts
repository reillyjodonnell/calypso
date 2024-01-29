import { RedisClientType } from 'redis';

export interface GoldRepositoryInterface {
  awardGold(playerId: string, amount: number): Promise<void>;
  spendGold(playerId: string, amount: number): Promise<boolean>;
  getGold(playerId: string): Promise<number>;
}

export class GoldRepository implements GoldRepositoryInterface {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async awardGold(playerId: string, amount: number): Promise<void> {
    await this.redisClient.hIncrBy('user:' + playerId, 'gold', amount);
  }

  async spendGold(playerId: string, amount: number): Promise<boolean> {
    const currentGold = await this.getGold(playerId);
    if (amount > currentGold) {
      return false;
    }
    await this.redisClient.hIncrBy('user:' + playerId, 'gold', -amount);
    return true;
  }

  async getGold(playerId: string): Promise<number> {
    const gold = await this.redisClient.hGet('user:' + playerId, 'gold');
    return parseInt(gold ?? '0', 10);
  }
}
