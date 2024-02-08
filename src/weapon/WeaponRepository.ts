import { RedisClientType } from '@redis/client';
import { WeaponDTO } from '../item/WeaponDTO';
import { Weapon } from '../item/weapon';
import { simpleWeapons } from '../item/MockItemDB';

export class WeaponRepository {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async addWeapon(weapon: Weapon): Promise<void> {
    const weaponKey = `weapon:${weapon.getId()}`;
    const serializedWeapon = JSON.stringify(new WeaponDTO(weapon));
    await this.redisClient.set(weaponKey, serializedWeapon);
  }

  async getWeapon(weaponId: string): Promise<Weapon | null> {
    // const weaponKey = `weapon:${weaponId}`;
    // const weaponJson = await this.redisClient.get(weaponKey);
    // if (!weaponJson) return null;
    // const weaponDTO = JSON.parse(weaponJson);
    // return WeaponDTO.fromDTO(weaponDTO);

    // for now return a promise and retrieve it from the file
    return new Promise((resolve, _) => {
      const weapon = simpleWeapons.find((weapon) => weapon.id === weaponId);
      if (weapon) {
        const weaponDTO = WeaponDTO.fromDTO(weapon);
        resolve(weaponDTO);
      } else {
        resolve(null);
      }
    });
  }

  async updateWeapon(weapon: Weapon): Promise<void> {
    const weaponKey = `weapon:${weapon.getId()}`;
    const serializedWeapon = JSON.stringify(new WeaponDTO(weapon));
    await this.redisClient.set(weaponKey, serializedWeapon);
  }

  async deleteWeapon(weaponId: string): Promise<void> {
    const weaponKey = `weapon:${weaponId}`;
    await this.redisClient.del(weaponKey);
  }
}
