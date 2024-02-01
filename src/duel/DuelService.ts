import { parseDieAndRoll } from '../dice/dice';
import { Player } from '../player/player';
import { RandomEventsGenerator } from '../randomEvents/RandomEventsGenerator';
import { CHALLENGED, CHALLENGER, Duel } from './Duel';

export const DUEL_STARTED = 'DUEL_STARTED';
export const DUEL_NOT_FOUND = 'DUEL_NOT_FOUND';
export const DUEL_ACCEPTED = 'DUEL_ACCEPTED';
export const ALREADY_ACCEPTED_DUEL = 'ALREADY_ACCEPTED_DUEL';
export const PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND';
export const PLAYER_NOT_CHALLENGED = 'PLAYER_NOT_CHALLENGED';
export const ALL_PLAYERS_READY = 'ALL_PLAYERS_READY';
export const ALL_PLAYERS_ROLLED = 'ALL_PLAYERS_ROLLED';
export const PLAYER_ALREADY_ROLLED = 'PLAYER_ALREADY_ROLLED';
export const PLAYER_ROLLED = 'PLAYER_ROLLED';
export const ATTACK_HITS = 'ATTACK_HITS';
export const CRITICAL_HIT = 'CRITICAL_HIT';
export const CRITICAL_FAIL = 'CRITICAL_FAIL';
export const ATTACK_MISSES = 'ATTACK_MISSES';
export const NOT_ATTACKERS_TURN = 'NOT_ATTACKERS_TURN';
export const NOT_PLAYERS_TURN = 'NOT_PLAYERS_TURN';
export const TARGET_DEAD = 'TARGET_DEAD';
export const TARGET_HIT = 'TARGET_HIT';
export const DUEL_INVALID = 'DUEL_INVALID';
export const ERROR_STARTING_DUEL = 'ERROR_STARTING_DUEL';

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
  | typeof NOT_PLAYERS_TURN
  | typeof DUEL_INVALID;

export class DuelService {
  private counter = 0;

  public getCounter() {
    // we increment to bypass the unique id constraint on buttons
    const count = this.counter;
    this.counter++;
    return count;
  }

  challengePlayer({
    challengerId,
    challengedId,
    duelId,
  }: {
    challengerId: string;
    challengedId: string;
    duelId: string;
  }): {
    status: typeof DUEL_STARTED | typeof DUEL_INVALID;
    players?: Player[];
    duel?: Duel;
  } {
    if (challengedId === challengerId) {
      return {
        status: DUEL_INVALID,
      };
    }

    const duel = new Duel(duelId);
    const challenger = new Player(challengerId);
    const challenged = new Player(challengedId);

    duel.addPlayer(challenger.getId(), CHALLENGER);
    duel.addPlayer(challenged.getId(), CHALLENGED);

    duel.setPlayerReady(challenger.getId());

    return {
      status: DUEL_STARTED,
      players: [challenger, challenged],
      duel,
    };
  }
  acceptDuel({ challengedId, duel }: { challengedId: string; duel: Duel }): {
    status:
      | typeof ALREADY_ACCEPTED_DUEL
      | typeof DUEL_NOT_FOUND
      | typeof PLAYER_NOT_FOUND
      | typeof PLAYER_NOT_CHALLENGED
      | typeof ALL_PLAYERS_READY
      | typeof DUEL_ACCEPTED;
    ids?: string[];
    count?: number;
    duel?: Duel;
  } {
    // Validate that the player accepting the duel is the challenged player
    const challengedRole = duel.getPlayerRole(challengedId);
    if (!challengedRole) throw new Error('Player not found');
    if (challengedRole !== CHALLENGED) {
      return {
        status: PLAYER_NOT_CHALLENGED,
      };
    }
    // make sure the player hasn't already accepted the duel
    const hasPlayerAcceptedDuel = duel.isPlayerReady(challengedId);
    if (hasPlayerAcceptedDuel) {
      return {
        status: ALREADY_ACCEPTED_DUEL,
      };
    }
    duel.setPlayerReady(challengedId);

    const allPlayersReady = duel.areAllPlayersReady();
    if (allPlayersReady) {
      return {
        status: ALL_PLAYERS_READY,
        ids: duel.getPlayersIds(),
        duel,
      };
    }
    return {
      status: DUEL_ACCEPTED,
      duel,
    };
  }
  rollForInitiative({
    duel,
    playerId,
    sidedDie,
  }: {
    duel: Duel | null;
    playerId: string;
    sidedDie: string;
  }): {
    status:
      | typeof DUEL_NOT_FOUND
      | typeof ALL_PLAYERS_ROLLED
      | typeof PLAYER_ROLLED
      | typeof PLAYER_ALREADY_ROLLED;
    result?: number;
    playerToGoFirst?: string;
  } {
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }
    // check if player has already rolled
    if (duel.hasPlayerRolledForInitiative(playerId)) {
      return {
        status: PLAYER_ALREADY_ROLLED,
      };
    }
    const result = duel.rollForInitative(playerId, sidedDie);
    duel.setIsBettingOpen(false);
    const allPlayersHaveRolled = duel.haveAllPlayersRolledForInitiative();

    if (allPlayersHaveRolled) {
      duel.generateTurnOrder();
      return {
        status: ALL_PLAYERS_ROLLED,
        result,
        playerToGoFirst: duel.getCurrentTurnPlayerId(),
      };
    }
    return {
      status: PLAYER_ROLLED,
      result,
    };
  }

  attemptToHit({
    duel,
    attacker,
    defender,
    sidedDie,
  }: {
    duel: Duel | null;
    attacker: Player | null;
    defender: Player | null;
    sidedDie: string | null;
  }): {
    status:
      | typeof DUEL_NOT_FOUND
      | typeof PLAYER_NOT_FOUND
      | typeof NOT_ATTACKERS_TURN
      | typeof ATTACK_HITS
      | typeof ATTACK_MISSES
      | typeof CRITICAL_HIT
      | typeof CRITICAL_FAIL;
    roll?: number;
    nextPlayerId?: string;
    attacker?: Player;
    defender?: Player;
    duel?: Duel;
  } {
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }

    if (!defender || !attacker) {
      return {
        status: PLAYER_NOT_FOUND,
      };
    }

    // const roll = parseDieAndRoll(sidedDie);
    const roll: number = 20;

    const currentTurnPlayerId = duel.getCurrentTurnPlayerId();
    if (attacker.getId() !== currentTurnPlayerId) {
      return { status: NOT_ATTACKERS_TURN };
    }

    const doesHitTarget = roll >= defender.getAC();

    if (doesHitTarget) {
      attacker.setTargetId(defender.getId());

      if (roll === 20) {
        return {
          status: CRITICAL_HIT,
          roll,
          duel,
          attacker,
          defender,
        };
      }

      return {
        status: ATTACK_HITS,
        roll,
        duel,
        attacker,
        defender,
      };
    }
    attacker.setTargetId('');
    duel.nextTurn();

    if (roll === 1) {
      return {
        status: CRITICAL_FAIL,
        roll,
        nextPlayerId: duel.getCurrentTurnPlayerId(),
        duel,
        attacker,
        defender,
      };
    }

    return {
      status: ATTACK_MISSES,
      roll,
      nextPlayerId: duel.getCurrentTurnPlayerId(),
      duel,
      attacker,
      defender,
    };
  }

  criticalFailAttack(player: Player | null) {
    if (!player) {
      return {
        status: PLAYER_NOT_FOUND,
      };
    }

    const { status, damage } = RandomEventsGenerator.emitRandomOutcome();
    if (damage) {
      player.hurt(damage);
      const isPlayerDead = player.isPlayerDead();
      return {
        isPlayerDead,
        damage,
        status,
        healthRemaining: player.getHealth(),
      };
    }
    return {
      status,
    };
  }

  getAttackerTargetId(attacker: Player | null) {
    if (!attacker) {
      return {
        status: PLAYER_NOT_FOUND,
      };
    }
    return {
      status: 'TARGET_FOUND',
      targetId: attacker.getTargetId(),
    };
  }

  rollFordamage({
    duel,
    attacker,
    defender,
    sidedDie,
    criticalHit = false,
  }: {
    duel: Duel | null;
    attacker: Player | null;
    defender: Player | null;
    sidedDie: string | null;
    criticalHit: boolean;
  }): {
    status:
      | typeof DUEL_NOT_FOUND
      | typeof PLAYER_NOT_FOUND
      | typeof NOT_ATTACKERS_TURN
      | typeof TARGET_DEAD
      | typeof TARGET_HIT;
    targetHealthRemaining?: number;
    roll?: number;
    criticalHitRoll?: number;
    nextPlayerId?: string;
  } {
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }

    if (!attacker || !defender) {
      return {
        status: PLAYER_NOT_FOUND,
      };
    }

    const roll = parseDieAndRoll(sidedDie);
    const criticalHitRoll = parseDieAndRoll(sidedDie);

    // attack the target
    defender.hurt(roll + (criticalHit ? criticalHitRoll : 0));
    const isTargetDead = defender.isPlayerDead();
    const targetHealthRemaining = defender.getHealth();
    attacker.clearTarget();

    // move to next turn
    duel.nextTurn();
    const nextPlayerId = duel.getCurrentTurnPlayerId();

    if (isTargetDead) {
      return {
        status: 'TARGET_DEAD',
        targetHealthRemaining,
        roll,
        criticalHitRoll: criticalHit ? criticalHitRoll : undefined,
        nextPlayerId,
      };
    }

    return {
      status: 'TARGET_HIT',
      targetHealthRemaining,
      roll,
      criticalHitRoll: criticalHit ? criticalHitRoll : undefined,
      nextPlayerId,
    };
  }

  healingRoll({
    duel,
    player,
    sidedDie,
  }: {
    duel: Duel | null;
    player: Player | null;
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
    duel?: Duel;
    player?: Player;
  } {
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }

    const roll = parseDieAndRoll(sidedDie);

    const currentTurnPlayerId = duel.getCurrentTurnPlayerId();
    if (player?.getId() !== currentTurnPlayerId) {
      return { status: NOT_PLAYERS_TURN };
    }

    if (!player) {
      return {
        status: PLAYER_NOT_FOUND,
      };
    }
    const healSuccess = player.heal(roll);
    const healthRemaining = player.getHealth();

    if (!healSuccess) {
      return {
        status: 'NO_MORE_POTIONS',
        healthRemaining,
        roll,
      };
    }
    duel.nextTurn();
    const nextPlayerId = duel.getCurrentTurnPlayerId();

    return {
      status: 'PLAYER_HEALED',
      healthRemaining,
      roll,
      nextPlayerId,
      duel,
      player,
    };
  }

  determineWinner(players: Player[]): { winnerId: string | null } {
    // Filter out players who are still alive
    const alivePlayers = players.filter((player) => !player.isPlayerDead());

    // Check if exactly one player is still alive
    if (alivePlayers.length === 1) {
      return { winnerId: alivePlayers[0].getId() };
    }

    // If no player or more than one player is still alive, there is no winner yet
    return { winnerId: null };
  }
  haveAnyPlayersRolledForInitiative(duel: Duel | null) {
    if (!duel) {
      throw new Error('Duel not found');
    }
    return duel.hasAnyPlayerRolledForInitiative();
  }
}
