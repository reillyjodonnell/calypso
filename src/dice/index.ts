// This represents all the types of dice we can roll
type DieTypes = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export function roll(typeOfDie: DieTypes) {
  var Chance = require('chance');
  var chance = new Chance();
  return chance.rpg(`1d${typeOfDie}`);
  //return Math.floor(Math.random() * typeOfDie) + 1;
}

export function parseDieAndRoll(die: string | null) {
  if (!die) throw new Error('die is null');

  const sides = parseInt(die.slice(1));
  const result = roll(sides as DieTypes);
  return result;
}
