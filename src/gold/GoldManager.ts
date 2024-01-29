export class GoldManager {
  private playerGold: Map<string, number>;

  constructor() {
    this.playerGold = new Map<string, number>();
  }

  awardGold(playerId: string, amount: number) {
    const currentGold = this.playerGold.get(playerId) || 0;
    this.playerGold.set(playerId, currentGold + amount);
  }

  spendGold(playerId: string, amount: number) {
    const currentGold = this.playerGold.get(playerId) || 0;
    if (amount > currentGold) {
      return false; // Not enough gold to spend
    }
    this.playerGold.set(playerId, currentGold - amount);
    return true;
  }

  getGold(playerId: string): number {
    return this.playerGold.get(playerId) || 0;
  }

  initializePlayer(playerId: string, initialGold: number = 0) {
    this.playerGold.set(playerId, initialGold);
  }
}
