import { PlayerManager } from '../player/player';

export class Duels {
  private duels: Map<string, PlayerManager> = new Map<string, PlayerManager>();

  public createDuel(duelId: string) {
    if (!this.duels.has(duelId)) {
      this.duels.set(duelId, new PlayerManager());
    }
    return duelId;
  }

  public getDuelById(duelId: string) {
    const duel = this.duels.get(duelId);
    if (!duel) throw new Error(`Duel ${duelId} does not exist`);
    return duel;
  }
}
