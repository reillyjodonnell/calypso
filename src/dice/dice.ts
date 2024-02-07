import Chance from 'chance';
const chance = new Chance();

export function roll(dice: string) {
  const value = chance.rpg(dice, { sum: true });
  return value as number;
}

export function parseDieAndRoll(die: string | null) {
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

export function getRollsWithModifiers(sidedDie: string, criticalHit: boolean) {
  //1. get modifiers
  const modifier = parseModifier(sidedDie);
  //2. remove modifiers from sided die
  // i.e. 1d6 - 1 should return 1d6
  let dice = sidedDie.split(' ')[0];

  //3. Double the die if critical hit
  // i.e. remove the first number and double it

  if (criticalHit) {
    const [num, type] = dice.split('d');
    const doubled = `${parseInt(num) * 2}d${type}`;
    dice = doubled;
  }
  //4. roll the die via  chance.rpg
  const rolls = chance.rpg(dice);

  // sum the rolls adding the modifier at the end

  const total = rolls.reduce((acc, curr) => acc + curr, modifier);

  return { rolls, total, modifier };

  //5. return the rolls and the total damage dealt PLUS the modifier in the total
}

export function parseModifier(roll: string) {
  // roll is a string like '1d20+3'
  // or '1d20 - 43'
  // or '1d20'
  // we want to return the modifier as a number
  // if there is no modifier, return 0

  if (roll.includes('+')) {
    const [_, val] = roll.split('+');
    // remove any spaces

    return parseInt(`${val}`);
  }

  if (roll.includes('-')) {
    const [_, val] = roll.split('-');
    return parseInt(`${-val}`);
  }
  return 0;
}
