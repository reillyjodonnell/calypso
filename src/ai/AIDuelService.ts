import { Duel } from '../duel/Duel';
import { DuelService } from '../duel/DuelService';
import { Player } from '../player/player';
import { AIDecisionService } from './AIDecisionService';

const AI_WEAPON_DIE = '1d6';
const AI_HEALING_DIE = '1d4';

export class AIDuelService {
  constructor(
    private duelService: DuelService // Handles the overall management of duels
  ) {}

  async processAITurn(duel: Duel, ai: Player, opponent: Player) {
    const decisionService = new AIDecisionService();
    const action = decisionService.decideAction(ai, duel);

    // Execute the action directly or via DuelService
    this.executeAIAction(action, ai, opponent, duel);
  }

  private executeAIAction(
    action: string,
    aiPlayer: Player,
    target: Player,
    duel: Duel
  ) {
    // Logic to execute the decided action.
    // This might involve calling specific methods on DuelService
    // to apply the action effects on the duel state.
    switch (action) {
      case 'attack':
        const {
          status,
          attacker,
          defender,
          duel: updatedDuel,
          nextPlayerId,
          roll,
        } = this.duelService.attemptToHit({
          duel,
          defender: target,
          attacker: aiPlayer,
          sidedDie: AI_WEAPON_DIE,
        });
        break;
      case 'heal':
        const { status, healthRemaining, nextPlayerId, player, roll } =
          this.duelService.healingRoll({
            duel,
            player: aiPlayer,
            sidedDie: AI_HEALING_DIE,
          });
        break;
      // We need to know if the AI got a critical hit from before
      case 'roll_for_damage':
        const {
          status,
          attacker,
          defender,
          duel: updatedDuel,
          nextPlayerId,
          roll,
        } = this.duelService.rollFordamage({
          duel,
          defender: target,
          attacker: aiPlayer,
          sidedDie: AI_WEAPON_DIE,
          criticalHit,
        });
        break;
    }
    // Potentially handle end of turn and transition to next player
  }
}
