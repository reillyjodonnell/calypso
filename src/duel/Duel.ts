import { parseDieAndRoll } from '../dice/dice';

export const CHALLENGED = 'CHALLENGED';
export const CHALLENGER = 'CHALLENGER';

type Role = typeof CHALLENGED | typeof CHALLENGER;

export class Duel {
  // key is the users id
  private participants: Map<
    string,
    {
      playerId: string;
      role: Role;
      isReady: boolean;
      rolledInitative: number;
      hasUsedItem: boolean;
      isAI?: boolean;
    }
  > = new Map();
  private turnNumber = 0;
  private currentTurn = 0;
  // array of player ids
  private turnOrder: string[] = [];

  private skippedPlayersIds: string[] = [];

  private isBettingOpen = true;

  constructor(private readonly id: string) {}

  public isAIPlayer(playerId: string) {
    return this.participants.get(playerId)?.isAI;
  }

  public setAIPlayer(playerId: string) {
    const playerInfo = this.participants.get(playerId);
    if (!playerInfo) {
      throw new Error('Player not found');
    }
    playerInfo.isAI = true;
    this.participants.set(playerId, playerInfo);
  }

  public getParticipants() {
    return this.participants;
  }

  public getIsBettingOpen() {
    return this.isBettingOpen;
  }
  public setIsBettingOpen(isBettingOpen: boolean) {
    this.isBettingOpen = isBettingOpen;
  }

  public getSkippedPlayersIds() {
    return this.skippedPlayersIds;
  }
  setSkippedPlayersIds(skippedPlayersIds: string[]) {
    this.skippedPlayersIds = skippedPlayersIds;
  }
  public skipPlayer(id: string) {
    this.skippedPlayersIds.push(id);
  }
  public removeSkippedPlayer(id: string) {
    this.skippedPlayersIds = this.skippedPlayersIds.filter(
      (playerId) => playerId !== id
    );
  }

  public addPlayer(playerId: string, role: Role) {
    this.participants.set(playerId, {
      playerId,
      role,
      isReady: false,
      rolledInitative: 0,
      hasUsedItem: false,
    });
  }

  public hasPlayerUsedItem(playerId: string) {
    return this.participants.get(playerId)?.hasUsedItem;
  }

  public setPlayerUsedItem(playerId: string) {
    const playerInfo = this.participants.get(playerId);
    if (!playerInfo) {
      throw new Error('Player not found');
    }
    playerInfo.hasUsedItem = true;
    this.participants.set(playerId, playerInfo);
  }

  public hasPlayerRolledForInitiative(playerId: string) {
    const entry = this.participants.get(playerId);
    return entry?.rolledInitative !== 0;
  }

  public hasAnyPlayerRolledForInitiative() {
    // check if any players have rolled for initiative
    return this.getPlayersIds().some((playerId) =>
      this.hasPlayerRolledForInitiative(playerId)
    );
  }

  public getPlayersInitiative() {
    return Array.from(this.participants.entries()).map(
      ([playerId, { rolledInitative }]) => ({
        playerId,
        rolledInitative,
      })
    );
  }

  public setPlayerInititative(playerId: string, initiative: number) {
    const playerInfo = this.participants.get(playerId);
    if (!playerInfo) {
      throw new Error('Player not found');
    }
    playerInfo.rolledInitative = initiative;
    this.participants.set(playerId, playerInfo);
  }

  public getTurnOrder() {
    return this.turnOrder;
  }

  public setTurnOrder(order: string[]) {
    this.turnOrder = order;
  }

  public setPlayerReady(playerId: string) {
    const playerInfo = this.participants.get(playerId);
    if (!playerInfo) {
      throw new Error('Player not found');
    }

    this.participants.set(playerId, { ...playerInfo, isReady: true });
  }

  public getPlayers() {
    return Array.from(this.participants.keys());
  }

  public getPlayerRole(playerId: string) {
    return this.participants.get(playerId)?.role;
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
    return Array.from(this.participants.keys());
  }

  public isPlayerPartOfDuel(id: string) {
    return this.getPlayersIds().includes(id);
  }

  public rollForInitative(id: string, sidesOfDie: string) {
    const result = parseDieAndRoll(sidesOfDie);
    const player = this.participants.get(id);
    if (!player) {
      throw new Error('Player not found');
    }
    player.rolledInitative = result;
    this.participants.set(id, player);
    return result;
  }

  public haveAllPlayersRolledForInitiative() {
    return this.getPlayersIds().every((playerId) =>
      this.hasPlayerRolledForInitiative(playerId)
    );
  }
  public generateTurnOrder() {
    const order = Array.from(this.participants.keys()).sort((a, b) => {
      const initiativeA = this.participants.get(a)?.rolledInitative ?? 0;
      const initiativeB = this.participants.get(b)?.rolledInitative ?? 0;
      return initiativeB - initiativeA;
    });
    this.setTurnOrder(order);
  }

  public getCurrentTurn() {
    return this.currentTurn;
  }

  public setCurrentTurn(currentTurn: number) {
    this.currentTurn = currentTurn;
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
  public setTurnNumber(turnNumber: number) {
    this.turnNumber = turnNumber;
  }

  public getCurrentTurnPlayerId() {
    return this.turnOrder[this.currentTurn];
  }

  public isPlayerReady(playerId: string) {
    return this.participants.get(playerId)?.isReady;
  }
}
