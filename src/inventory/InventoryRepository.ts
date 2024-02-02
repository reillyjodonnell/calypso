import { RedisClientType } from '@redis/client';
import { Item } from '../item/Item';
import { WeaponDTO } from '../item/WeaponDTO';
import { Weapon } from '../item/weapon';

export class InventoryRepository {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async awardItem(playerId: string, item: Item | Weapon): Promise<void> {
    // check if item is a weapon
    if (item instanceof Weapon) {
      const weaponDTO = new WeaponDTO(item as Weapon);
      const inventoryKey = `user:${playerId}:inventory`;
      const serializedWeapon = JSON.stringify(weaponDTO);
      // Add the item JSON string to the user's inventory hash
      await this.redisClient.hSet(inventoryKey, weaponDTO.id, serializedWeapon);
    } else {
      console.log('Item is not a weapon! Rn we only support weapons');
    }
  }

  async saveItem(playerId: string, item: Item | Weapon): Promise<void> {
    // check if item is a weapon
    if (item instanceof Weapon) {
      const weaponDTO = new WeaponDTO(item as Weapon);
      const inventoryKey = `user:${playerId}:inventory`;
      const serializedWeapon = JSON.stringify(weaponDTO);
      // Add the item JSON string to the user's inventory hash
      await this.redisClient.hSet(inventoryKey, weaponDTO.id, serializedWeapon);
    } else {
      console.log('Item is not a weapon! Rn we only support weapons');
    }
  }

  async getItem(playerId: string, item: string) {
    const inventoryKey = `user:${playerId}:inventory`;
    const itemJson = await this.redisClient.hGet(inventoryKey, item);

    if (!itemJson) return null;
    const weaponDTO = JSON.parse(itemJson);
    return WeaponDTO.fromDTO(weaponDTO);
  }

  async removeItem(playerId: string, item: string): Promise<void> {
    const inventoryKey = `user:${playerId}:inventory`;

    // Remove the item from the user's inventory hash
    await this.redisClient.hDel(inventoryKey, item);
  }

  async getItems(playerId: string) {
    const inventoryKey = `user:${playerId}:inventory`;
    const itemsHash = await this.redisClient.hGetAll(inventoryKey);

    if (!itemsHash) return null;

    const items = Object.values(itemsHash).map((itemJson) => {
      const weaponDTO = JSON.parse(itemJson);
      return WeaponDTO.fromDTO(weaponDTO);
    });

    return items;
  }

  async getActiveWeapon(playerId: string) {
    const items = await this.getItems(playerId);
    if (!items) return null;
    return items.find((item) => item.getEquipped());
  }
}
