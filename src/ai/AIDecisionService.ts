import { Duel } from '../duel/Duel';
import { Player } from '../player/player';

export class AIDecisionService {
  public decideAction(player: Player, duel: Duel) {
    if (
      player.getHealth() / player.getMaxHealth() < 0.5 &&
      player.hasHealsLeft()
    ) {
      return 'heal';
    }
    // if (
    //   player.getHealth() / player.getMaxHealth() < 0.5 &&
    //   !player.hasHealsLeft() &&
    //   !duel.hasPlayerUsedItem(player.getId())
    // ) {
    //   return 'use item';
    // }
    if (player.getTargetId()) {
      return 'roll_for_damage';
    }
    return 'attack';
  }
}
