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
        this.applyRiskyPotionEffect(player);
        break;
      case 'Smoke Bomb':
        // Logic to increase opponent's miss chance
        break;
      case 'Mirror Shield':
        // Logic to reflect damage
        break;
      case 'Sudden Strike':
        // Logic to allow double attack with reduced damage
        break;
    }

    itemEffect.decrementTurns();
  }

  private applyRiskyPotionEffect(player: Player) {
    // Example implementation (you might want to include randomness)
    const effect = Math.random() < 0.5 ? -5 : 20; // -5 for damage, 20 for heal
    if (effect < 0) {
      player.hurt(effect);
      return;
    }
    player.heal(effect);
  }

  // Additional methods for other effects...
}
