import { simpleWeapons } from '../item/MockItemDB';
import { WeaponDTO } from '../item/WeaponDTO';
import { Weapon } from '../item/weapon';

export class StoreRepository {
  async getItems(): Promise<Weapon[]> {
    return new Promise((resolve, _) => {
      // loop and create WeaponDTO for each
      const items = simpleWeapons.map((weapon) => {
        // by default all weapons are unequipped
        const weaponDTO = WeaponDTO.fromDTO({ ...weapon });
        return weaponDTO;
      });
      resolve(items);
    });
  }

  async getItem(itemId: string): Promise<Weapon | null> {
    return new Promise((resolve, _) => {
      const item = simpleWeapons.find((weapon) => weapon.id === itemId);
      if (item) {
        const weaponDTO = WeaponDTO.fromDTO({ ...item });
        resolve(weaponDTO);
      } else {
        resolve(null);
      }
    });
  }
}
