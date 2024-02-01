import { EmbedBuilder } from '@discordjs/builders';
import { DiscordService } from '../discord/DiscordService';
import { GoldManager } from '../gold/GoldManager';
import { Player } from '../player/player';
import { SettledWager, WagerService } from '../wager/WagerService';
import { DuelService } from './DuelService';

const GOLD_AMOUNT_FOR_WIN = 5;

export class DuelWinManager {
  constructor(
    private duelService: DuelService,
    private wagerService: WagerService,
    private goldManager: GoldManager,
    private discordService: DiscordService
  ) {}

  async handleWin(
    duelId: string,
    players: Player[]
  ): Promise<void | EmbedBuilder> {
    try {
      const { winnerId } = this.duelService.determineWinner(players);
      console.log(`Winner is ${winnerId}. Thread id: ${duelId}`);
      if (winnerId) {
        // give the winner 2 gold for winning
        await this.goldManager.awardGold(winnerId, GOLD_AMOUNT_FOR_WIN);
        // Handling the wagers
        const settledWagers = await this.wagerService.settleWagers({
          threadId: duelId,
          winnerId,
        });
        // Handling the wager results
        const wagerResultsEmbed = this.discordService.showWagerResults(
          settledWagers,
          winnerId
        );

        return wagerResultsEmbed;
      }
    } catch (error) {
      console.error(`Error handling wager payout: ${error}`);
    }

    // Add any additional logic for cases where there's no clear winner
  }
}
