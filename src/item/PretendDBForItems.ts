const simpleSword = {
  id: '1',
  emoji: '⚔️',
  name: 'Simple Sword',
  type: 'melee',
  rarity: 'common',
  description: 'Deals 1d6 damage',
  damage: '1d6',
  rollToHit: '1d20',
  critHit: [20],
  critFail: [1],
  critChance: 0.05,
  critFailChance: 0.05,
  price: 10,
};

const simpleDagger = {
  id: '2',
  emoji: '🗡️',
  name: 'Simple Dagger',
  type: 'melee',
  rarity: 'common',
  description: 'Deals 1d4 + 1 damage with more crits',
  damage: '1d4 + 1',
  rollToHit: '1d20',
  critHit: [19, 20],
  critFail: [1],
  critChance: 0.1,
  critFailChance: 0.1,
  price: 15,
};

const simpleWarhammer = {
  id: '3',
  emoji: '🔨',
  name: 'Simple Warhammer',
  type: 'melee',
  rarity: 'common',
  description: 'Deals 1d8 damage. High crit fail chance. -1 to hit',
  damage: '1d8',
  rollToHit: '1d20 - 1',
  critHit: [],
  critFail: [0, 1],
  critChance: 0.05,
  critFailChance: 0.1,
  price: 25,
};

const simpleBow = {
  id: '4',
  emoji: '🏹',
  name: 'Simple Bow',
  type: 'ranged',
  rarity: 'common',
  description: 'Deals 2d4 damage with a +1 to hit. High crit fail chance',
  damage: '1d6',
  rollToHit: '1d20 + 1',
  critHit: [20],
  critFail: [2, 3],
  critChance: 0.05,
  critFailChance: 0.1,
  price: 20,
};

const woodenStaff = {
  id: '5',
  emoji: '🔱',
  name: 'Wooden Staff',
  type: 'magic',
  rarity: 'common',
  description: 'Deals 1d4+1 damage',
  damage: '1d4 + 1',
  damageModifier: 1,
  rollToHit: '1d20',
  critHit: [20],
  critFail: [1],
  critChance: 0.05,
  critFailChance: 0.05,
  price: 20,
};

export const simpleWeapons = [
  simpleSword,
  simpleDagger,
  simpleWarhammer,
  simpleBow,
  woodenStaff,
];
