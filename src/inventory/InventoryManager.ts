import { Item } from '../item/Item';

class InventoryManager {
  private items: Item[];

  constructor() {
    this.items = [];
  }

  addItem(item: Item) {
    this.items.push(item);
  }

  removeItem(itemId: string) {
    this.items = this.items.filter((item) => item.id !== itemId);
  }

  // Other inventory management methods...
}
