import Chance from 'chance';
const chance = new Chance();

export function roll(dice: string) {
  const value = chance.rpg(dice, { sum: true });
  return value as number;
}

export function parseDieAndRoll(die: string | null) {
  console.log('die', die);
  if (!die) throw new Error('die is null');

  // it may include a +1 for damage modifier i.e. '1d4 + 1'
  if (die.includes('+')) {
    const [dieType, modifier] = die.split('+');
    const result = roll(dieType) + parseInt(modifier);
    return result;
  }

  // it may include a -1 for damage modifier i.e. '1d4 - 1'
  if (die.includes('-')) {
    const [dieType, modifier] = die.split('-');
    const result = roll(dieType) - parseInt(modifier);
    return result;
  }

  const result = roll(die);
  return result;
}
