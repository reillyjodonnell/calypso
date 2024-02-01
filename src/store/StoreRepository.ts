type Item = {
  name: string;
  emoji: string;
  id: string;
  description: string;
  price: string;
};

export class StoreRepository {
  async getItems(): Promise<Item[]> {
    return new Promise((resolve, _) => {
      resolve([...featuredItems, ...standardItems]);
    });
  }
}

const featuredItems = [
  {
    name: 'Elixir of Ares',
    emoji: '🔮',
    id: '1',
    description: 'Heals 2d4 health points.',
    price: '100 gold',
  },
  {
    name: 'Cloak of Shadows',
    emoji: '🌫️',
    id: '2',
    description: 'Grants temporary invisibility.',
    price: '150 gold',
  },
  {
    name: 'Ring of Fortitude',
    emoji: '💍',
    id: '3',
    description: '+2ac against first attack.',
    price: '120 gold',
  },
];
const standardItems = [
  {
    name: 'Sword',
    emoji: '⚔️',
    id: '4',
    description: '1d6 attack',
    price: '50 gold',
  },
  {
    name: 'Warhammer',
    emoji: '🔨',
    id: '5',
    description: '1d8 attack',
    price: '70 gold',
  },
  {
    name: 'Bow',
    emoji: '🏹',
    id: '6',
    description: '2d4 attack',
    price: '60 gold',
  },
  {
    name: 'Staff',
    emoji: '🔱',
    id: '7',
    description: '1d6 attack',
    price: '50 gold',
  },
];
