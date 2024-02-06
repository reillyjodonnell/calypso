import { EmbedBuilder } from '@discordjs/builders';
import { DiscordService } from '../discord/DiscordService';
import { GoldManager } from '../gold/GoldManager';
import { Player } from '../player/player';
import { WagerService } from '../wager/WagerService';
import { DuelService } from './DuelService';
import { LeaderboardApplicationService } from '../leaderboard/LeaderboardApplicationService';
import { DuelSQLRepository } from './DuelSQLRepository';

const GOLD_AMOUNT_FOR_WIN = 5;

export class DuelWinManager {
  constructor(
    private duelService: DuelService,
    private wagerService: WagerService,
    private goldManager: GoldManager,
    private discordService: DiscordService,
    private leaderboardApplicationService: LeaderboardApplicationService,
    private duelSQLRepository: DuelSQLRepository
  ) {}

  async handleWin(
    duelId: string,
    players: Player[]
  ): Promise<null | EmbedBuilder> {
    try {
      const { winnerId } = this.duelService.determineWinner(players);
      if (winnerId) {
        // give the winner 5 gold for winning
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

        this.leaderboardApplicationService.recordWin(winnerId);

        await this.duelSQLRepository.putUsers({
          id: winnerId, // Assuming winnerId is the user's ID
          gamesWon: 1, // Assuming you want to increment gamesWon for the winner
          gamesLost: 0, // Assuming you want to keep track of gamesLost (set to 0 for the winner)
        });

        return wagerResultsEmbed;
      }
      return null;
    } catch (error) {
      console.error(`Error handling wager payout: ${error}`);
      return null;
    }

    // Add any additional logic for cases where there's no clear winner
  }
}
