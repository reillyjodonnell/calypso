import { GoldRepositoryInterface } from './GoldRepository';

export class GoldManager {
  private goldRepository: GoldRepositoryInterface;

  constructor(goldRepository: GoldRepositoryInterface) {
    this.goldRepository = goldRepository;
  }

  async awardGold(playerId: string, amount: number): Promise<void> {
    await this.goldRepository.awardGold(playerId, amount);
  }

  async spendGold(playerId: string, amount: number): Promise<boolean> {
    const currentGold = await this.getGold(playerId);
    if (amount > currentGold) {
      return false; // Not enough gold to spend
    }
    await this.goldRepository.spendGold(playerId, amount);
    return true;
  }

  async getGold(playerId: string): Promise<number> {
    return await this.goldRepository.getGold(playerId);
  }

  async initializePlayer(
    playerId: string,
    initialGold: number = 0
  ): Promise<void> {
    await this.goldRepository.awardGold(playerId, initialGold);
  }
}
