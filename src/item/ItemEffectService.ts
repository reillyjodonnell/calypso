import { Chance } from 'chance';
import type { Player } from '../player/player';
import type { ItemEffect } from './ItemEffects';

const SMOKE_BOMB_PERCENTAGE_MODIFIER = 0.7;

export interface PreRoundModifiers {
  extraHeal: number | null;
}

export interface PreAttackModifiers {
  allowExtraAttack: boolean;
  extraAttackDamageModifier: number | null; // Default to no modification unless specified by an effect
  defenseModifierMultiple: number | null; // Additional defense modifier, could be positive or negative
  reflectedDamage: number | null; // Proportion of damage to reflect, 0 by default
}

export class ItemEffectService {
  applyEffect(player: Player, itemEffect: ItemEffect) {
    console.log(itemEffect.getName());
    switch (itemEffect.getName()) {
      case "Healer's Herb":
        player.addEffect(itemEffect);
        player.heal(3);
        break;
      case 'Risky Potion':
        // Implement the logic for risky potion (random heal or damage)
        const { damage, heal } = this.applyRiskyPotionEffect(player);

        return { damage, heal };
      case 'Smoke Bomb':
        // Logic to increase opponent's miss chance
        player.addEffect(itemEffect);
        break;
      case 'Mirror Shield':
        // Logic to reflect damage
        player.addEffect(itemEffect);
        break;
      case 'Sudden Strike':
        // Logic to allow double attack with reduced damage
        player.addEffect(itemEffect);
        return { status: 'suddenStrike' };
    }
  }
  removeExpiredEffects(player: Player) {
    const effects = player.getEffects();
    effects.forEach((effect) => {
      if (effect.getTurnsRemaining() === 0) {
        player.removeEffect(effect);
      }
    });
  }

  decrementEffectTurns(player: Player) {
    player.getEffects().forEach((effect) => {
      effect.decrementTurns();
    });
  }

  private applyRiskyPotionEffect(player: Player) {
    const rolledDice = Chance().rpg('1d2', { sum: true });
    if (rolledDice === 1) {
      player.hurt(5);
      return { damage: 5 };
    }
    player.heal(20);
    return { heal: 20 };
  }

  applyPreRoundEffects(player: Player): PreRoundModifiers {
    let results: PreRoundModifiers = {
      extraHeal: null,
    };
    player.getEffects().forEach((effect) => {
      console.log(effect);
      if (effect.getTurnsRemaining() <= 0) {
        return;
      }
      switch (effect.getName()) {
        case "Healer's Herb":
          results.extraHeal = 3;
          break;
      }
    });
    return results;
  }

  applyPreAttackEffects(attacker: Player, defender: Player | null) {
    let attackModifiers: PreAttackModifiers = {
      allowExtraAttack: false,
      extraAttackDamageModifier: null, // Default to no modification unless specified by an effect
      defenseModifierMultiple: null, // Additional defense modifier, could be positive or negative
      reflectedDamage: null, // Proportion of damage to reflect, 0 by default
    };
    attacker.getEffects().forEach((effect) => {
      if (effect.getTurnsRemaining() <= 0) {
        return;
      }
      switch (effect.getName()) {
        case 'Sudden Strike': {
          attackModifiers.allowExtraAttack = true;
          attackModifiers.extraAttackDamageModifier = 0.5;
        }
      }
    });
    defender?.getEffects().forEach((effect) => {
      if (effect.getTurnsRemaining() <= 0) {
        return;
      }
      switch (effect.getName()) {
        case 'Smoke Bomb':
          attackModifiers.defenseModifierMultiple =
            SMOKE_BOMB_PERCENTAGE_MODIFIER;

        case 'Mirror Shield':
          attackModifiers.reflectedDamage = 0.5;
      }
    });
    return attackModifiers;
  }

  // Additional methods for other effects...
}
