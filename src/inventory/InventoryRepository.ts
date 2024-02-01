import { RedisClientType } from '@redis/client';

export class InventoryRepository {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async awardItem(
    playerId: string,
    item: string,
    description: string,
    quantity: number
  ): Promise<void> {
    const inventoryKey = `user:${playerId}:inventory`;
    const itemData = { description, quantity };
    const itemJson = JSON.stringify(itemData);

    // Add the item JSON string to the user's inventory hash
    await this.redisClient.hSet(inventoryKey, item, itemJson);
  }

  async removeItem(playerId: string, item: string): Promise<void> {
    const inventoryKey = `user:${playerId}:inventory`;

    // Remove the item from the user's inventory hash
    await this.redisClient.hDel(inventoryKey, item);
  }

  async getItems(
    playerId: string
  ): Promise<{ item: string; description: string; quantity: number }[]> {
    const inventoryKey = `user:${playerId}:inventory`;
    const itemsHash = await this.redisClient.hGetAll(inventoryKey);

    // Convert the hash of JSON strings to an array of item objects
    return Object.entries(itemsHash).map(([item, itemJson]) => ({
      item,
      ...JSON.parse(itemJson),
    }));
  }
}
