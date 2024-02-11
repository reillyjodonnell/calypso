import { InventoryRepository } from '../inventory/InventoryRepository';
import { StoreRepository } from '../store/StoreRepository';

export class UserService {
  constructor(
    private inventoryRepository: InventoryRepository,
    private storeRepository: StoreRepository
  ) {}
  async initializeUser(playerId: string) {
    const idOfBasicSword = '1';
    const basicSword = await this.storeRepository.getWeapon(idOfBasicSword);
    if (!basicSword) {
      console.error('Could not find basic sword in store');
      return;
    }
    // equip the basic sword
    await this.inventoryRepository.awardWeapon(playerId, basicSword);
    await this.inventoryRepository.saveWeapon(playerId, {
      equipped: true,
      id: idOfBasicSword,
      quantity: 1,
    });
  }
  retrieveActiveWeapon(playerId: string) {
    return this.inventoryRepository.getActiveWeapon(playerId);
  }
}
