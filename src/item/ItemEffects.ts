import { Player } from '../player/player';
import { Item } from './Item';

export class ItemEffects {
  private turnsRemaining = 0;

  handleItemEffect(item: Item, target: Player) {
    switch (item.name) {
      case 'Smoke Bomb':
        // opponent higher chance for missing next attack
        break;
      case 'Mirror Shield':
        //reflect random % of damage back at opponent
        break;
      case 'Risky Potion':
        // heals 20 or hurts you 5
        target.setHealth(target.getHealth() + 20);
        target.setHealth(target.getHealth() - 5);

        break;
      case "Healer's Herb":
        target.setHealth(target.getHealth() + 3);
        // applies for 2 more turns
        break;
      case 'Sudden Strike':
        // attack again with 50% less damage
        break;
    }
  }
}
