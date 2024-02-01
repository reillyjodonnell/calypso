import { PlayerRepository } from '../player/PlayerRepository';
import { WagerRepository } from '../wager/WagerRepository';
import { Duel } from './Duel';
import { DuelRepository } from './DuelRepository';

export class DuelCleanup {
  constructor(
    private wagerRepository: WagerRepository,
    private duelRepository: DuelRepository,
    private playerRepository: PlayerRepository
  ) {}

  public async remove(threadId: string, duel: Duel) {
    // delete wagers
    await this.wagerRepository.clearWager(threadId);

    // delete duel
    await this.duelRepository.deleteDuel(threadId);

    // delete players for duel
    for (const playerId of duel.getPlayers()) {
      await this.playerRepository.delete(threadId, playerId);
    }
  }
}
