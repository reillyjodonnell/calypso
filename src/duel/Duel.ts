import { parseDieAndRoll } from '../dice/dice.ts';
import { Player } from '../player/player';

export const CHALLENGED = 'CHALLENGED';
export const CHALLENGER = 'CHALLENGER';

type Role = typeof CHALLENGED | typeof CHALLENGER;

export class Duel {
  private participants: Map<Player, { role: Role; isReady: boolean }> =
    new Map();
  private turnNumber = 0;
  private currentTurn = 0;
  private turnOrder: Player[] = [];

  // need to track skipped players
  private skippedPlayersIds: string[] = [];

  private rolledInitatives: Map<string, number> = new Map();

  constructor(private readonly id: string) {}

  public getSkippedPlayersIds() {
    return this.skippedPlayersIds;
  }
  public skipPlayer(id: string) {
    this.skippedPlayersIds.push(id);
  }
  public removeSkippedPlayer(id: string) {
    this.skippedPlayersIds = this.skippedPlayersIds.filter(
      (playerId) => playerId !== id
    );
  }

  public addPlayer(player: Player, role: Role) {
    this.participants.set(player, { role, isReady: false });
  }

  public hasPlayerRolledForInitiative(playerId: string) {
    const initative = this.rolledInitatives.get(playerId);
    return typeof initative === 'number';
  }

  public hasAnyPlayerRolledForInitiative() {
    // check if any players have rolled for initiative
    return this.getPlayersIds().some((playerId) =>
      this.hasPlayerRolledForInitiative(playerId)
    );
  }

  public setTurnOrder(order: Player[]) {
    this.turnOrder = order;
  }

  public getPlayerById(id: string) {
    for (const player of this.participants.keys()) {
      if (player.getId() === id) {
        // Assuming each Player object has an 'id' property
        return player;
      }
    }
    return undefined;
  }

  public setPlayerReady(player: Player) {
    const playerInfo = this.participants.get(player);
    if (!playerInfo) {
      throw new Error('Player not found');
    }

    this.participants.set(player, { ...playerInfo, isReady: true });
  }

  public getPlayers() {
    return Array.from(this.participants.keys());
  }

  public getPlayerRole(player: Player) {
    return this.participants.get(player);
  }

  public getId() {
    return this.id;
  }

  public areAllPlayersReady() {
    return Array.from(this.participants.values()).every(
      ({ isReady }) => isReady
    );
  }

  public getPlayersIds() {
    return Array.from(this.participants.keys()).map((player) => player.getId());
  }

  public isPlayerPartOfDuel(id: string) {
    return this.getPlayersIds().includes(id);
  }

  public rollForInitative(id: string, sidesOfDie: string) {
    const result = parseDieAndRoll(sidesOfDie);

    this.rolledInitatives.set(id, result);
    return result;
  }

  public haveAllPlayersRolledForInitiative() {
    return this.getPlayersIds().every((id) => this.rolledInitatives.has(id));
  }
  public generateTurnOrder() {
    const order = Array.from(this.participants.keys()).sort((a, b) => {
      const initiativeA = this.rolledInitatives.get(a.getId()) || 0;
      const initiativeB = this.rolledInitatives.get(b.getId()) || 0;
      return initiativeB - initiativeA;
    });
    this.setTurnOrder(order);
  }

  public getCurrentTurn() {
    return this.currentTurn;
  }

  public nextTurn() {
    this.turnNumber++;
    // only up to the number of players
    if (this.currentTurn === this.turnOrder.length - 1) {
      this.currentTurn = 0;
    } else {
      this.currentTurn++;
    }
  }

  public getTurnNumber() {
    return this.turnNumber;
  }

  public getCurrentTurnPlayerId() {
    return this.turnOrder[this.currentTurn];
  }

  public isPlayerReady(playerId: string) {
    const player = this.getPlayerById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    const playerInfo = this.participants.get(player);
    if (!playerInfo) {
      throw new Error('Player not found');
    }
    return playerInfo.isReady;
  }
}
