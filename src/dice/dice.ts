import Chance from 'chance';
const chance = new Chance();

// This represents all the types of dice we can roll
type DieTypes = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export function roll(typeOfDie: DieTypes) {
  const value = chance.rpg(`1d${typeOfDie}`, { sum: true });
  return value as number;
}

export function parseDieAndRoll(die: string | null) {
  if (!die) throw new Error('die is null');

  const sides = parseInt(die.slice(1));
  const result = roll(sides as DieTypes);
  return result;
}
