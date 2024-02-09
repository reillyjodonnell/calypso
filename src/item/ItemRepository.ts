import { ItemEffect } from './ItemEffects';
import { specialItems } from './MockItemDB';

export class ItemRepository {
  async getItemById(id: string): Promise<ItemEffect> {
    return new Promise((resolve, reject) => {
      const item = specialItems.find((item) => item.id === id);
      if (item) {
        resolve(item);
      } else {
        reject('Item not found');
      }
    });
  }
  async getItems() {
    return new Promise((resolve) => {
      resolve(specialItems);
    });
  }
}
