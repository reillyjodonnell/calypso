import { Duel, CHALLENGED, CHALLENGER } from './Duel';

type Role = 'CHALLENGED' | 'CHALLENGER';

interface ParticipantDTO {
  role: Role;
  isReady: boolean;
  rolledInitative: number;
  playerId: string;
  hasUsedItem: boolean;
}

export class DuelDTO {
  id: string;
  participants: ParticipantDTO[];
  turnNumber: number;
  currentTurn: number;
  turnOrder: string[]; // Storing just the IDs of the players in the turn order
  skippedPlayersIds: string[];
  isBettingOpen: boolean;

  constructor(duel: Duel) {
    this.id = duel.getId();
    this.participants = Array.from(duel.getParticipants()).map(
      ([playerId, details]) => ({
        playerId: playerId,
        isReady: details.isReady,
        role: details.role,
        rolledInitative: details.rolledInitative,
        hasUsedItem: details.hasUsedItem,
      })
    );
    this.isBettingOpen = duel.getIsBettingOpen();
    this.turnNumber = duel.getTurnNumber();
    this.currentTurn = duel.getCurrentTurn();
    this.turnOrder = duel.getTurnOrder();
    this.skippedPlayersIds = duel.getSkippedPlayersIds();
  }

  static fromDTO(duelDTO: DuelDTO): Duel {
    const duel = new Duel(duelDTO.id);

    duelDTO.participants.forEach((participantDTO) => {
      const { playerId } = participantDTO;
      const role =
        participantDTO.role === 'CHALLENGED' ? CHALLENGED : CHALLENGER;
      duel.addPlayer(playerId, role);
      if (participantDTO.isReady) {
        duel.setPlayerReady(playerId);
      }
      if (participantDTO.rolledInitative) {
        duel.setPlayerInititative(playerId, participantDTO.rolledInitative);
      }
      if (participantDTO.hasUsedItem) {
        duel.setPlayerUsedItem(playerId);
      }
    });
    duel.setIsBettingOpen(duelDTO.isBettingOpen);
    duel.setTurnNumber(duelDTO.turnNumber);
    duel.setCurrentTurn(duelDTO.currentTurn);
    duel.setTurnOrder(duelDTO.turnOrder);
    duel.setSkippedPlayersIds(duelDTO.skippedPlayersIds);
    return duel;
  }
}
