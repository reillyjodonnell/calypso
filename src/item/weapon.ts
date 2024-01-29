import { Item } from './Item';

export class Weapon extends Item {
  constructor(id: string, name: string, rarity: string, description: string) {
    super(id, name, 'Weapon', rarity, description);
  }
}
