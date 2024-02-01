import { Duel, CHALLENGED, CHALLENGER } from './Duel';

type Role = 'CHALLENGED' | 'CHALLENGER';

interface ParticipantDTO {
  playerId: string;
  role: Role;
  isReady: boolean;
}

type RolledInitiativesType = {
  [playerId: string]: number;
};

export class DuelDTO {
  id: string;
  participants: ParticipantDTO[];
  turnNumber: number;
  currentTurn: number;
  turnOrder: string[]; // Storing just the IDs of the players in the turn order
  skippedPlayersIds: string[];
  rolledInitiatives: RolledInitiativesType;

  constructor(duel: Duel) {
    this.id = duel.getId();
    this.participants = Array.from(duel.getParticipants()).map(
      ([playerId, details]) => ({
        playerId: playerId,
        role: details.role,
        isReady: details.isReady,
      })
    );
    this.turnNumber = duel.getTurnNumber();
    this.currentTurn = duel.getCurrentTurn();
    this.turnOrder = duel.getTurnOrder();
    this.skippedPlayersIds = duel.getSkippedPlayersIds();
    this.rolledInitiatives = Array.from(duel.getRolledInitatives()).reduce(
      (acc, [playerId, initiative]) => {
        acc[playerId] = initiative;
        return acc;
      },
      {} as RolledInitiativesType
    );
  }

  static fromDTO(duelDTO: DuelDTO): Duel {
    const duel = new Duel(duelDTO.id);

    duelDTO.participants.forEach((participantDTO: ParticipantDTO) => {
      const role =
        participantDTO.role === 'CHALLENGED' ? CHALLENGED : CHALLENGER;
      duel.addPlayer(participantDTO.playerId, role);
      if (participantDTO.isReady) {
        duel.setPlayerReady(participantDTO.playerId);
      }
    });

    duel.setTurnNumber(duelDTO.turnNumber);
    duel.setCurrentTurn(duelDTO.currentTurn);
    duel.setTurnOrder(duelDTO.turnOrder);
    duel.setSkippedPlayersIds(duelDTO.skippedPlayersIds);
    duel.setRolledInitiatives(
      new Map(Object.entries(duelDTO.rolledInitiatives))
    );

    return duel;
  }
}
