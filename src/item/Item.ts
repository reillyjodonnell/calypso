export class Item {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public type: string,
    public rarity: string,
    public price: number
  ) {}
}

// How do we do armor/ shields?

const simpleArmor = {
  id: '1',
  name: 'Leather Armor',
  type: 'defensive',
  rarity: 'common',
  description: 'A simple leather armor',
};

const simpleShield = {
  id: '2',
  name: 'Wooden Shield',
  type: 'defensive',
  rarity: 'common',
  description: 'A simple wood shield',
};

const example = {
  weapons: [
    {
      name: 'Sword',
      type: 'melee',
      damage: '1d6',
      crit_chance: 5, // Represents a 1 in 20 chance (20 - 5 + 1)
      crit_fail_chance: 1, // Represents a 1 in 20 chance
      price: 10,
    },
    {
      name: 'Dagger',
      type: 'melee',
      damage: '1d4',
      crit_chance: 10, // Higher crit chance
      crit_fail_chance: 2,
      price: 8,
    },
    // ... other weapons
  ],
  defensive_items: [
    {
      name: 'Shield',
      type: 'defensive',
      damage_reduction: 2,
      price: 15,
    },
    {
      name: 'Armor',
      type: 'defensive',
      crit_hit_reduction: 5, // Reduces crit hit chance against the player
      price: 20,
    },
    // ... other defensive items
  ],
  consumables: [
    {
      name: 'Health Potion',
      type: 'consumable',
      effect: 'heal',
      heal_amount: '2d4',
      price: 5,
      cooldown: 0, // No cooldown for potions
    },
    {
      name: 'Mana Potion',
      type: 'consumable',
      effect: 'restore_mana',
      mana_amount: 10,
      price: 5,
      cooldown: 0,
    },
    // ... other consumables
  ],
  special_items: [
    {
      name: 'Teleport Scroll',
      type: 'special',
      effect: 'teleport',
      cooldown: 3, // Number of turns before it can be used again
      price: 12,
    },
    // ... other special items
  ],
};
