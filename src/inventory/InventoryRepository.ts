import { RedisClientType } from '@redis/client';
import { Item } from '../item/Item';
import { Weapon } from '../item/weapon';

export type InventoryItem = {
  quantity: number;
  id: string;
  // only applicable for weapons
  equipped?: boolean;
};

export class InventoryRepository {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async awardWeapon(playerId: string, weapon: Weapon): Promise<void> {
    const inventoryKey = `user:${playerId}:inventory`;
    const itemRecord = await this.redisClient.hGet(
      inventoryKey,
      weapon.getId()
    );

    let inventoryData;
    if (itemRecord) {
      inventoryData = JSON.parse(itemRecord);
      inventoryData.quantity += 1; // Increment quantity
    } else {
      inventoryData = { id: weapon.getId(), quantity: 1, equipped: false };
    }

    await this.redisClient.hSet(
      inventoryKey,
      weapon.getId(),
      JSON.stringify(inventoryData)
    );
  }

  async getWeapon(
    playerId: string,
    itemId: string
  ): Promise<InventoryItem | null> {
    const inventoryKey = `user:${playerId}:inventory`;
    const itemRecord = await this.redisClient.hGet(inventoryKey, itemId);

    if (!itemRecord) return null;
    return JSON.parse(itemRecord);
  }

  async removeWeapon(playerId: string, itemId: string): Promise<void> {
    const inventoryKey = `user:${playerId}:inventory`;
    await this.redisClient.hDel(inventoryKey, itemId);
  }

  async getWeapons(playerId: string): Promise<InventoryItem[]> {
    const inventoryKey = `user:${playerId}:inventory`;
    const itemsHash = await this.redisClient.hGetAll(inventoryKey);

    return Object.values(itemsHash).map((itemJson) => JSON.parse(itemJson));
  }

  async getActiveWeapon(playerId: string) {
    const items = await this.getWeapons(playerId);
    return items.find((item) => item.equipped);
  }

  async saveWeapon(
    playerId: string,
    updatedItem: InventoryItem
  ): Promise<void> {
    const inventoryKey = `user:${playerId}:inventory`;
    await this.redisClient.hSet(
      inventoryKey,
      updatedItem.id,
      JSON.stringify(updatedItem)
    );
  }

  // Items:

  async awardItem(playerId: string, item: Item): Promise<void> {
    if (item instanceof Item) {
      const inventoryKey = `user:${playerId}:items`;
      const itemRecord = await this.redisClient.hGet(
        inventoryKey,
        item.getId()
      );

      let inventoryData;
      if (itemRecord) {
        inventoryData = JSON.parse(itemRecord);
        inventoryData.quantity += 1; // Increment quantity
      } else {
        inventoryData = { id: item.getId(), quantity: 1 };
      }

      await this.redisClient.hSet(
        inventoryKey,
        item.getId(),
        JSON.stringify(inventoryData)
      );
    }
  }

  async getItem(
    playerId: string,
    itemId: string
  ): Promise<InventoryItem | null> {
    const inventoryKey = `user:${playerId}:items`;
    const itemRecord = await this.redisClient.hGet(inventoryKey, itemId);

    if (!itemRecord) return null;
    return JSON.parse(itemRecord);
  }

  async getItems(playerId: string): Promise<InventoryItem[]> {
    const inventoryKey = `user:${playerId}:items`;
    const itemsHash = await this.redisClient.hGetAll(inventoryKey);

    return Object.values(itemsHash).map((itemJson) => JSON.parse(itemJson));
  }

  async useItem(playerId: string, itemId: string): Promise<void> {
    const inventoryKey = `user:${playerId}:items`;
    const itemRecord = await this.redisClient.hGet(inventoryKey, itemId);

    if (!itemRecord) return;
    const inventoryData = JSON.parse(itemRecord);
    if (inventoryData.quantity > 1) {
      inventoryData.quantity -= 1;
      await this.redisClient.hSet(
        inventoryKey,
        itemId,
        JSON.stringify(inventoryData)
      );
    } else {
      await this.redisClient.hDel(inventoryKey, itemId);
    }
  }
}
