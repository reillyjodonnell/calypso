import { GoldManager } from '../gold/GoldManager';
import { WagerService } from '../wager/WagerService';
import { DuelService } from './DuelService';

const GOLD_AMOUNT_FOR_WIN = 5;

export class DuelWinManager {
  constructor(
    private duelService: DuelService,
    private wagerService: WagerService,
    private goldManager: GoldManager
  ) {}

  async handleWin(duelId: string): Promise<void> {
    const { winnerId } = this.duelService.determineWinner(duelId);

    if (winnerId) {
      // give the winner 2 gold for winning
      await this.goldManager.awardGold(winnerId, GOLD_AMOUNT_FOR_WIN);
      // Handling the wagers
      await this.wagerService.settleWagers(duelId, winnerId);
    }

    // Add any additional logic for cases where there's no clear winner
  }
}
