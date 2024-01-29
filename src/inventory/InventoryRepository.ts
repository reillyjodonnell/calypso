import { RedisClientType } from '@redis/client';

export class InventoryRepository {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async awardItem(playerId: string, item: string): Promise<void> {
    await this.redisClient.sAdd('user:' + playerId, item);
  }

  async removeItem(playerId: string, item: string): Promise<void> {
    await this.redisClient.sRem('user:' + playerId, item);
  }

  async getItems(playerId: string): Promise<string[]> {
    const items = await this.redisClient.sMembers('user:' + playerId);
    return items;
  }

  async initializePlayer(
    playerId: string,
    initialItems: string[] = []
  ): Promise<void> {
    await this.redisClient.sAdd('user:' + playerId, ...initialItems);
  }
}
