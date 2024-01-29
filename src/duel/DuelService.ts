import { parseDieAndRoll } from '../..';
import { Player, PlayerManager } from '../player/player';
import { CHALLENGED, CHALLENGER, Duel } from './Duel';
import { DuelRepository } from './DuelRepository';

export const DUEL_STARTED = 'DUEL_STARTED';
export const DUEL_NOT_FOUND = 'DUEL_NOT_FOUND';
export const DUEL_ACCEPTED = 'DUEL_ACCEPTED';
export const ALREADY_ACCEPTED_DUEL = 'ALREADY_ACCEPTED_DUEL';
export const PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND';
export const PLAYER_NOT_CHALLENGED = 'PLAYER_NOT_CHALLENGED';
export const ALL_PLAYERS_READY = 'ALL_PLAYERS_READY';
export const ALL_PLAYERS_ROLLED = 'ALL_PLAYERS_ROLLED';
export const PLAYER_ROLLED = 'PLAYER_ROLLED';
export const ATTACK_HITS = 'ATTACK_HITS';
export const ATTACK_MISSES = 'ATTACK_MISSES';
export const NOT_ATTACKERS_TURN = 'NOT_ATTACKERS_TURN';
export const NOT_PLAYERS_TURN = 'NOT_PLAYERS_TURN';
export const TARGET_DEAD = 'TARGET_DEAD';
export const TARGET_HIT = 'TARGET_HIT';

export type DuelStatus =
  | typeof DUEL_STARTED
  | typeof DUEL_ACCEPTED
  | typeof PLAYER_NOT_FOUND
  | typeof PLAYER_NOT_CHALLENGED
  | typeof DUEL_NOT_FOUND
  | typeof ALL_PLAYERS_READY
  | typeof ALL_PLAYERS_ROLLED
  | typeof PLAYER_ROLLED
  | typeof ALREADY_ACCEPTED_DUEL
  | typeof ATTACK_HITS
  | typeof ATTACK_MISSES
  | typeof NOT_ATTACKERS_TURN
  | typeof NOT_PLAYERS_TURN;

export class DuelService {
  constructor(
    private duelRepository: DuelRepository,
    private playerManager: PlayerManager
  ) {}
  challengePlayer({
    challengerId,
    challengedId,
    duelId,
  }: {
    challengerId: string;
    challengedId: string;
    duelId: string;
  }): { status: typeof DUEL_STARTED } {
    const duel = new Duel(duelId);
    const challenger = this.playerManager.addPlayer(challengerId);
    const challenged = this.playerManager.addPlayer(challengedId);
    duel.addPlayer(challenger, CHALLENGER);
    duel.addPlayer(challenged, CHALLENGED);

    duel.setPlayerReady(challenger);
    this.duelRepository.save(duel);

    return {
      status: DUEL_STARTED,
    };
  }
  acceptDuel({
    challengedId,
    duelId,
  }: {
    challengedId: string;
    duelId: string;
  }): {
    status:
      | typeof ALREADY_ACCEPTED_DUEL
      | typeof DUEL_NOT_FOUND
      | typeof PLAYER_NOT_FOUND
      | typeof PLAYER_NOT_CHALLENGED
      | typeof ALL_PLAYERS_READY
      | typeof DUEL_ACCEPTED;
    ids?: string[];
  } {
    const duel = this.duelRepository.getById(duelId);
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }

    // make sure the player hasn't already accepted the duel
    const hasPlayerAcceptedDuel = duel.isPlayerReady(challengedId);
    if (hasPlayerAcceptedDuel) {
      return {
        status: ALREADY_ACCEPTED_DUEL,
      };
    }
    const isPlayerInDuel = duel.isPlayerPartOfDuel(challengedId);
    if (!isPlayerInDuel) {
      return {
        status: PLAYER_NOT_FOUND,
      };
    }

    const challenged = duel.getPlayerById(challengedId);
    if (!challenged)
      return {
        status: PLAYER_NOT_FOUND,
      };
    // Validate that the player accepting the duel is the challenged player
    const challengedRole = duel.getPlayerRole(challenged);
    if (!challengedRole) throw new Error('Player not found');
    if (challengedRole.role !== CHALLENGED) {
      return {
        status: PLAYER_NOT_CHALLENGED,
      };
    }
    duel.setPlayerReady(challenged);
    this.duelRepository.save(duel);

    const allPlayersReady = duel.areAllPlayersReady();
    if (allPlayersReady) {
      return {
        status: ALL_PLAYERS_READY,
        ids: duel.getPlayersIds(),
      };
    }
    return {
      status: DUEL_ACCEPTED,
    };
  }
  rollForInitiative({
    duelId,
    playerId,
    sidedDie,
  }: {
    duelId: string;
    playerId: string;
    sidedDie: string;
  }): {
    status:
      | typeof DUEL_NOT_FOUND
      | typeof ALL_PLAYERS_ROLLED
      | typeof PLAYER_ROLLED;
    result?: number;
    playerToGoFirst?: string;
  } {
    const duel = this.duelRepository.getById(duelId);
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }
    const result = duel.rollForInitative(playerId, sidedDie);
    const allPlayersHaveRolled = duel.haveAllPlayersRolledForInitiative();
    this.duelRepository.save(duel);
    if (allPlayersHaveRolled) {
      duel.generateTurnOrder();
      this.duelRepository.save(duel);
      return {
        status: ALL_PLAYERS_ROLLED,
        result,
        playerToGoFirst: duel.getCurrentTurnPlayerId().getId(),
      };
    }
    return {
      status: PLAYER_ROLLED,
      result,
    };
  }
  attemptToHit({
    duelId,
    attackerId,
    defenderId,
    sidedDie,
  }: {
    duelId: string;
    attackerId: string;
    defenderId: string;
    sidedDie: string | null;
  }): {
    status:
      | typeof DUEL_NOT_FOUND
      | typeof PLAYER_NOT_FOUND
      | typeof NOT_ATTACKERS_TURN
      | typeof ATTACK_HITS
      | typeof ATTACK_MISSES;
    roll?: number;
    nextPlayer?: Player;
  } {
    const duel = this.duelRepository.getById(duelId);
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }
    const attacker = duel.getPlayerById(attackerId);
    if (!attacker) {
      return {
        status: PLAYER_NOT_FOUND,
      };
    }
    const roll = parseDieAndRoll(sidedDie);

    const currentTurnPlayerId = duel.getCurrentTurnPlayerId();
    if (attackerId !== currentTurnPlayerId.getId()) {
      return { status: NOT_ATTACKERS_TURN };
    }

    const defender = this.playerManager.getPlayer(defenderId);
    if (!defender) {
      return {
        status: PLAYER_NOT_FOUND,
      };
    }

    const doesHitTarget = this.playerManager.doesAttackHitPlayer(
      defender,
      roll
    );
    if (doesHitTarget) {
      this.playerManager.setPlayerTarget(attackerId, defenderId);
      this.duelRepository.save(duel);

      return {
        status: ATTACK_HITS,
        roll,
      };
    }
    this.playerManager.clearPlayerTarget(attackerId);
    duel.nextTurn();
    this.duelRepository.save(duel);

    return {
      status: ATTACK_MISSES,
      roll,
      nextPlayer: duel.getCurrentTurnPlayerId(),
    };
  }
  rollFordamage({
    duelId,
    attackerId,
    sidedDie,
  }: {
    duelId: string;
    attackerId: string;
    sidedDie: string | null;
  }): {
    status:
      | typeof DUEL_NOT_FOUND
      | typeof PLAYER_NOT_FOUND
      | typeof NOT_ATTACKERS_TURN
      | typeof TARGET_DEAD
      | typeof TARGET_HIT;
    targetHealthRemaining?: number;
    targetId?: string;
    winnerId?: string | null;
    roll?: number;
    nextPlayerId?: string;
  } {
    const duel = this.duelRepository.getById(duelId);
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }
    const attacker = duel.getPlayerById(attackerId);
    if (!attacker) {
      return {
        status: PLAYER_NOT_FOUND,
      };
    }
    const roll = parseDieAndRoll(sidedDie);

    const currentTurnPlayerId = duel.getCurrentTurnPlayerId();
    if (attackerId !== currentTurnPlayerId.getId()) {
      return { status: NOT_ATTACKERS_TURN };
    }

    const { isTargetDead, targetHealthRemaining, targetId } =
      this.playerManager.attackTarget(attacker, roll);
    this.playerManager.clearPlayerTarget(attackerId);
    duel.nextTurn();
    const { winnerId } = this.determineWinner(duelId);
    const nextPlayerId = duel.getCurrentTurnPlayerId().getId();
    this.duelRepository.save(duel);

    if (isTargetDead) {
      return {
        status: 'TARGET_DEAD',
        targetHealthRemaining,
        targetId,
        winnerId,
        roll,
        nextPlayerId,
      };
    }

    return {
      status: 'TARGET_HIT',
      targetHealthRemaining,
      targetId,
      roll,
      nextPlayerId,
    };
  }
  determineWinner(duelId: string): { winnerId: string | null } {
    const duel = this.duelRepository.getById(duelId);
    if (!duel) {
      throw new Error('Duel not found');
    }

    const alivePlayers = duel
      .getPlayers()
      .filter((player) => !this.playerManager.isPlayerDead(player));
    if (alivePlayers.length === 1) {
      return { winnerId: alivePlayers[0].getId() };
    }

    return { winnerId: null };
  }
  healingRoll({
    duelId,
    playerId,
    sidedDie,
  }: {
    duelId: string;
    playerId: string;
    sidedDie: string | null;
  }): {
    status:
      | typeof DUEL_NOT_FOUND
      | typeof PLAYER_NOT_FOUND
      | typeof NOT_PLAYERS_TURN
      | 'PLAYER_HEALED'
      | 'NO_MORE_POTIONS';
    healthRemaining?: number;
    roll?: number;
    nextPlayerId?: string;
  } {
    const duel = this.duelRepository.getById(duelId);
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }
    const player = duel.getPlayerById(playerId);
    if (!player) {
      return {
        status: PLAYER_NOT_FOUND,
      };
    }
    const roll = parseDieAndRoll(sidedDie);

    const currentTurnPlayerId = duel.getCurrentTurnPlayerId();
    if (playerId !== currentTurnPlayerId.getId()) {
      return { status: NOT_PLAYERS_TURN };
    }

    const { healSuccess, healthRemaining } = this.playerManager.healPlayer(
      player,
      roll
    );

    if (!healSuccess) {
      return {
        status: 'NO_MORE_POTIONS',
        healthRemaining,
        roll,
      };
    }
    duel.nextTurn();
    const nextPlayerId = duel.getCurrentTurnPlayerId().getId();
    this.duelRepository.save(duel);

    return {
      status: 'PLAYER_HEALED',
      healthRemaining,
      roll,
      nextPlayerId,
    };
  }
}