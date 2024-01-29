import { createClient, RedisClientType } from 'redis';

interface GoldRepository {
  awardGold(playerId: string, amount: number): Promise<void>;
  spendGold(playerId: string, amount: number): Promise<boolean>;
  getGold(playerId: string): Promise<number>;
  initializePlayer(playerId: string, initialGold?: number): Promise<void>;
}

export class RedisGoldRepository implements GoldRepository {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async awardGold(playerId: string, amount: number): Promise<void> {
    const currentGold = await this.getGold(playerId);
    await this.redisClient.set(playerId, currentGold + amount);
  }

  async spendGold(playerId: string, amount: number): Promise<boolean> {
    const currentGold = await this.getGold(playerId);
    if (amount > currentGold) {
      return false;
    }
    await this.redisClient.set(playerId, currentGold - amount);
    return true;
  }

  async getGold(playerId: string): Promise<number> {
    const gold = await this.redisClient.get(playerId);
    return parseInt(gold ?? '0') || 0;
  }

  async initializePlayer(
    playerId: string,
    initialGold: number = 0
  ): Promise<void> {
    await this.redisClient.set(playerId, initialGold);
  }
}
