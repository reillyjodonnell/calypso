import { RedisClientType } from '@redis/client';
import { Item } from '../item/Item';
import { Weapon } from '../item/weapon';

export type InventoryItem = {
  quantity: number;
  equipped: boolean;
  id: string;
};

export class InventoryRepository {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async awardItem(playerId: string, item: Item | Weapon): Promise<void> {
    if (item instanceof Weapon) {
      const inventoryKey = `user:${playerId}:inventory`;
      const itemRecord = await this.redisClient.hGet(
        inventoryKey,
        item.getId()
      );

      let inventoryData;
      if (itemRecord) {
        inventoryData = JSON.parse(itemRecord);
        inventoryData.quantity += 1; // Increment quantity
      } else {
        inventoryData = { id: item.getId(), quantity: 1, equipped: false };
      }

      await this.redisClient.hSet(
        inventoryKey,
        item.getId(),
        JSON.stringify(inventoryData)
      );
    } else {
      console.log('Item is not a weapon! Rn we only support weapons');
    }
  }

  async getItem(
    playerId: string,
    itemId: string
  ): Promise<InventoryItem | null> {
    const inventoryKey = `user:${playerId}:inventory`;
    const itemRecord = await this.redisClient.hGet(inventoryKey, itemId);

    if (!itemRecord) return null;
    return JSON.parse(itemRecord);
  }

  async removeItem(playerId: string, itemId: string): Promise<void> {
    const inventoryKey = `user:${playerId}:inventory`;
    await this.redisClient.hDel(inventoryKey, itemId);
  }

  async getItems(playerId: string): Promise<InventoryItem[]> {
    const inventoryKey = `user:${playerId}:inventory`;
    const itemsHash = await this.redisClient.hGetAll(inventoryKey);

    return Object.values(itemsHash).map((itemJson) => JSON.parse(itemJson));
  }

  async getActiveWeapon(playerId: string) {
    const items = await this.getItems(playerId);
    return items.find((item) => item.equipped);
  }

  async saveItems(
    playerId: string,
    updatedItems: InventoryItem[]
  ): Promise<void> {
    const inventoryKey = `user:${playerId}:inventory`;
    const pipeline = this.redisClient.multi();

    updatedItems.forEach((item) => {
      pipeline.hSet(inventoryKey, item.id, JSON.stringify(item));
    });

    // Execute all commands in the pipeline
    await pipeline.exec();
  }

  async saveItem(playerId: string, updatedItem: InventoryItem): Promise<void> {
    const inventoryKey = `user:${playerId}:inventory`;
    await this.redisClient.hSet(
      inventoryKey,
      updatedItem.id,
      JSON.stringify(updatedItem)
    );
  }
}
