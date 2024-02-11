import { Item } from './Item';
import { ItemEffect } from './ItemEffects';
import { specialItems } from './MockItemDB';
import { ItemDTO } from './itemDTO';

export class ItemRepository {
  async getItemById(id: string): Promise<Item> {
    return new Promise((resolve, reject) => {
      const item = specialItems.find((item) => item.id === id);
      if (item) {
        const converted = ItemDTO.fromDTO(item);
        resolve(converted);
      } else {
        reject('Item not found');
      }
    });
  }
  async getItems(): Promise<Item[]> {
    return new Promise((resolve) => {
      // fetch from db
      const items = specialItems.map((item) => ItemDTO.fromDTO(item));

      resolve(items);
    });
  }
}
