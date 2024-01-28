import { Duel } from './Duel';

export class DuelRepository {
  private duels: Map<string, Duel> = new Map<string, Duel>();

  public save(duel: Duel) {
    this.duels.set(duel.getId(), duel);
  }

  public getById(id: string) {
    return this.duels.get(id);
  }
}
