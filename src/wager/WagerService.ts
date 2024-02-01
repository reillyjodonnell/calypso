import { DuelService } from '../duel/DuelService';
import { GoldManager } from '../gold/GoldManager';
import { WagerManager } from './WagerManager';

export const NOT_A_VALID_NUMBER = 'NOT_A_VALID_NUMBER';
export const NOT_ENOUGH_GOLD = 'NOT_ENOUGH_GOLD';
export const WAGER_PLACED = 'WAGER_PLACED';

export class WagerService {
  constructor(
    private goldManager: GoldManager,
    private wagerManager: WagerManager,
    private duelService: DuelService
  ) {}

  public async createWager({
    amount,
    threadId,
    guildId,
    userId,
    bettingOn,
  }: {
    amount: string;
    threadId: string | null;
    guildId: string | null;
    userId: string;
    bettingOn: string;
  }) {
    if (!threadId || !guildId) {
      throw new Error('Thread id or guild id is not provided');
    }

    // check that the amount is a positive number
    const isPositiveNumber = Number(amount) > 0;

    if (!isPositiveNumber) {
      return {
        status: NOT_A_VALID_NUMBER,
      };
    }

    const parsedAmount = Number(amount);

    // Check if the user has enough money
    const doesUserHaveEnough =
      (await this.goldManager.getGold(userId)) >= parsedAmount;

    if (!doesUserHaveEnough) {
      return {
        status: NOT_ENOUGH_GOLD,
      };
    }

    // They have enough
    await this.goldManager.spendGold(userId, parsedAmount);

    await this.wagerManager.placeWager(threadId, {
      amount: parsedAmount,
      betOnPlayerId: bettingOn,
      playerId: userId,
    });

    return {
      status: WAGER_PLACED,
    };
  }

  public async settleWagers(
    threadId: string,
    winningPlayerId: string
  ): Promise<void> {
    const wagers = await this.wagerManager.getWagers(threadId);

    for (const wager of wagers) {
      if (wager.betOnPlayerId === winningPlayerId) {
        // Calculate payout amount (this could be the same as the wager, double, etc.)
        const payoutAmount = this.calculatePayout(wager.amount);

        // Award gold to the winning player
        await this.goldManager.awardGold(wager.playerId, payoutAmount);
      }
    }

    // Additional logic as needed, e.g., handling losing wagers
  }

  private calculatePayout(betAmount: number): number {
    // Implement the payout calculation logic here

    // get number of bets

    // ratio against the players

    // adjusts the bet payout * the ratio

    return betAmount * 2;
  }

  // async canAcceptWagers(threadId: string) {
  //   // only accept if no players have rolled for inititative
  //   const haveAnyPlayersRolledForInitiative =
  //     await this.duelService.haveAnyPlayersRolledForInitiative(threadId);
  //   return !haveAnyPlayersRolledForInitiative;
  // }
}
