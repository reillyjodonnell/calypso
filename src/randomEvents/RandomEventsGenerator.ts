export const SELF_HARM = 'SELF_HARM';
export const NO_EFFECT = 'NO_EFFECT';
export const FALL_DOWN = 'FALL_DOWN';

export class RandomEventsGenerator {
  static emitRandomOutcome(): {
    status: typeof SELF_HARM | typeof NO_EFFECT | typeof FALL_DOWN;
    damage?: number;
  } {
    const outcomes = [SELF_HARM, NO_EFFECT];
    const selectedOutcome = getRandomOutcome(outcomes);

    switch (selectedOutcome) {
      case SELF_HARM:
        const damageRange = [1, 2];

        const damage = chooseRandomly(damageRange);
        return {
          status: SELF_HARM,
          damage,
        };

      // player.hurt(damage);
      // // Apply self-harm logic, like reducing player's health
      // const isPlayerDead = player.isPlayerDead();
      // return {
      //   isPlayerDead,
      //   description: `You swing at your target, but miss and hit yourself for ${damage} damage! ${
      //     isPlayerDead
      //       ? 'You have died!'
      //       : `You have ${player.getHealth()} health remaining.`
      //   }`,
      // };
      case NO_EFFECT:
        return {
          status: NO_EFFECT,
        };
      // return {
      //   description: `You swing at your target and miss terribly. Somehow you recovered!`,
      // };

      default:
        throw new Error('Invalid outcome');
    }
  }
}

function getRandomOutcome(outcomes: Array<string>) {
  const randomIndex = Math.floor(Math.random() * outcomes.length);
  return outcomes[randomIndex];
}

function chooseRandomly<T>(options: T[]): T {
  if (options.length !== 2) {
    throw new Error('Array must contain exactly two elements.');
  }
  const randomIndex = Math.random() < 0.5 ? 0 : 1;
  return options[randomIndex];
}
