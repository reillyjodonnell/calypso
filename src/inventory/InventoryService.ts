import { Weapon } from '../item/weapon';
import { InventoryItem, InventoryRepository } from './InventoryRepository';

export class InventoryService {
  private inventoryRepository: InventoryRepository;

  constructor(inventoryRepository: InventoryRepository) {
    this.inventoryRepository = inventoryRepository;
  }

  async equipWeapon({
    weapons,
    weaponId,
    playerId,
  }: {
    weapons: InventoryItem[];
    weaponId: string;
    playerId: string;
  }): Promise<void> {
    const weaponToEquip = weapons.find((item) => item.id === weaponId);

    if (!weaponToEquip) {
      throw new Error('Weapon does not exist in inventory');
    }

    // Ensure only one weapon is equipped at a time
    for (const item of weapons) {
      if (item) {
        if (item.equipped) {
          item.equipped = false;
          await this.inventoryRepository.saveItem(playerId, item);
        }
      }
    }

    weaponToEquip.equipped = true;
    await this.inventoryRepository.saveItem(playerId, weaponToEquip);
  }

  // ... other service methods
}
