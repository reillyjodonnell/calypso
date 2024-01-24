import { Player, PlayerManager } from './player';

const duels = new Map<string, PlayerManager>();

export function createDuel(duelId: string) {
  if (!duels.has(duelId)) {
    duels.set(duelId, new PlayerManager());
  }
  return duelId;
}

export function getDuelById(duelId: string) {
  return duels.get(duelId);
}
