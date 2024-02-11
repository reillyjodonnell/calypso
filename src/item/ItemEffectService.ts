import { Chance } from 'chance';
import type { Player } from '../player/player';
import type { ItemEffect } from './ItemEffects';

export class ItemEffectService {
  applyEffect(player: Player, itemEffect: ItemEffect) {
    switch (itemEffect.getName()) {
      case "Healer's Herb":
        player.heal(3);
        break;
      case 'Risky Potion':
        // Implement the logic for risky potion (random heal or damage)
        const { damage, heal } = this.applyRiskyPotionEffect(player);

        return { damage, heal };
      case 'Smoke Bomb':
        // Logic to increase opponent's miss chance
        // opponent.addEffect(itemEffect);
        break;
      case 'Mirror Shield':
        // Logic to reflect damage
        // opponent.addEffect(itemEffect);
        break;
      case 'Sudden Strike':
        // Logic to allow double attack with reduced damage
        player.addEffect(itemEffect);
        break;
    }

    itemEffect.decrementTurns();
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

  // Additional methods for other effects...
}
