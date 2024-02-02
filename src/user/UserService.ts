import { InventoryRepository } from '../inventory/InventoryRepository';
import { StoreRepository } from '../store/StoreRepository';

export class UserService {
  constructor(
    private inventoryRepository: InventoryRepository,
    private storeRepository: StoreRepository
  ) {}
  async initializeUser(playerId: string) {
    const idOfBasicSword = '1';
    const basicSword = await this.storeRepository.getItem(idOfBasicSword);
    if (!basicSword) {
      console.error('Could not find basic sword in store');
      return;
    }
    // equip the basic sword
    basicSword.setEquipped(true);
    this.inventoryRepository.awardItem(playerId, basicSword);
    console.log('Initializing user with id:', playerId);
  }
  retrieveActiveWeapon(playerId: string) {
    return this.inventoryRepository.getActiveWeapon(playerId);
  }
}
