import { WagerRepository } from '../wager/WagerRepository';

export class DuelCleanup {
  constructor(private wagerRepository: WagerRepository) {}

  public async cleanupDuel(threadId: string) {
    await this.wagerRepository.clearWager(threadId);
    // delete duel

    // delete players for duel
  }
}
