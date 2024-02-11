import { getRollsWithModifiers, parseDieAndRoll } from '../dice/dice';
import { Item } from '../item/Item';
import { ItemEffectService } from '../item/ItemEffectService';
import { ItemEffect, isValidItemEffectName } from '../item/ItemEffects';
import { ItemRepository } from '../item/ItemRepository';
import { Weapon } from '../item/weapon';
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
    challengerWeapon,
    challengedWeapon,
  }: {
    challengerId: string;
    challengedId: string;
    duelId: string;
    challengerWeapon: Weapon;
    challengedWeapon: Weapon;
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
    challenger.setCriticalFail(challengerWeapon.getCritFail());
    challenger.setCriticalHit(challengerWeapon.getCritHit());
    challenger.setDamage(challengerWeapon.getDamage());
    challenger.setRollToHit(challengerWeapon.getRollToHit());
    const challenged = new Player(challengedId);
    challenged.setCriticalFail(challengedWeapon.getCritFail());
    challenged.setCriticalHit(challengedWeapon.getCritHit());
    challenged.setDamage(challengedWeapon.getDamage());
    challenged.setRollToHit(challengedWeapon.getRollToHit());

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

    if (challengedRole !== CHALLENGED || !challengedRole) {
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

    console.log(sidedDie, 'sidedDie');
    const roll = parseDieAndRoll(sidedDie);

    const currentTurnPlayerId = duel.getCurrentTurnPlayerId();
    if (attacker.getId() !== currentTurnPlayerId) {
      return { status: NOT_ATTACKERS_TURN };
    }

    const doesHitTarget = roll >= defender.getAC();

    if (doesHitTarget) {
      attacker.setTargetId(defender.getId());

      if (attacker.getCriticalHit().includes(roll)) {
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

    if (attacker.getCriticalFail().includes(roll)) {
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
    console.log(attacker.getTargetId(), 'attacker.getTargetId()');
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
    rolls?: number[];
    damage?: number;
    nextPlayerId?: string;
    modifier?: number;
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

    if (attacker.getId() !== duel.getCurrentTurnPlayerId()) {
      return {
        status: NOT_ATTACKERS_TURN,
      };
    }

    if (!sidedDie) {
      throw new Error('sidedDie is null');
    }

    const { rolls, total, modifier } = getRollsWithModifiers(
      sidedDie,
      criticalHit
    );

    let sepuku = false;
    // if the attacker and defender are the same player, the attacker hurts themselves
    if (attacker.getId() === defender.getId()) {
      sepuku = true;
      attacker.hurt(total);
    } else {
      // attack the target
      defender.hurt(total);
    }

    const isTargetDead = sepuku
      ? attacker.isPlayerDead()
      : defender.isPlayerDead();
    const targetHealthRemaining = sepuku
      ? attacker.getHealth()
      : defender.getHealth();
    attacker.clearTarget();

    // move to next turn
    duel.nextTurn();
    const nextPlayerId = duel.getCurrentTurnPlayerId();

    if (isTargetDead) {
      return {
        status: 'TARGET_DEAD',
        targetHealthRemaining,
        rolls,
        damage: total,
        nextPlayerId,
        modifier,
      };
    }

    return {
      status: 'TARGET_HIT',
      targetHealthRemaining,
      rolls,
      damage: total,
      nextPlayerId,
      modifier,
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

  async useItem({
    duel,
    player,
    itemId,
  }: {
    duel: Duel | null;
    player: Player | null;
    itemId: string;
  }): Promise<{
    status: typeof DUEL_NOT_FOUND | 'ITEM_USED' | 'PLAYER_NOT_FOUND';
    damage?: number;
    item?: Item;
    heal?: number;
    playerDead?: boolean;
  }> {
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }

    if (!player) {
      return {
        status: 'PLAYER_NOT_FOUND',
      };
    }

    const itemRepository = new ItemRepository();

    const item = await itemRepository.getItemById(itemId);

    if (!item) {
      throw new Error('Item not found');
    }

    const itemEffectName = item.getName();
    if (!isValidItemEffectName(itemEffectName)) {
      throw new Error('Invalid item effect name');
    }

    // apply the item effect
    const itemEffect = new ItemEffect(itemEffectName);

    const itemEffectService = new ItemEffectService();

    const res = itemEffectService.applyEffect(player, itemEffect);

    duel.setPlayerUsedItem(player.getId());

    duel.nextTurn();

    // the other layer will handle removing the item from the players inventory
    return {
      status: 'ITEM_USED',
      damage: res?.damage,
      item,
      heal: res?.heal,
      playerDead: player.isPlayerDead(),
    };
  }

  canUseItem({ duel, playerId }: { duel: Duel | null; playerId: string }) {
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }

    // make sure the player has the item and hasn't used an item this match
    const hasUsedItem = duel.hasPlayerUsedItem(playerId);

    return !hasUsedItem;
  }

  determineWinner(players: Player[]): { winnerId: string | null } {
    // Filter out players who are still alive
    const alivePlayers = players.filter((player) => {
      console.log(`player ${player.getId()} health ${player.getHealth}`);
      return !player.isPlayerDead();
    });

    // Check if exactly one player is still alive
    if (alivePlayers.length === 1) {
      console.log('winnerId', alivePlayers[0].getId());
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

  getNumberOfDice(sidedDie: string, criticalHit: boolean) {
    const baseAttackNumberOfDice = parseInt(sidedDie.split('d')[0]);

    // if critical double it otherwise return the base attack
    return criticalHit ? baseAttackNumberOfDice * 2 : baseAttackNumberOfDice;
  }
}
