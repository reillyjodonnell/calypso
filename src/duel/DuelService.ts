import { AIDuelService } from '../ai/AIDuelService';
import { getRollsWithModifiers, parseDieAndRoll } from '../dice/dice';
import { Item } from '../item/Item';
import {
  PreAttackModifiers,
  ItemEffectService,
} from '../item/ItemEffectService';
import { ItemEffect, isValidItemEffectName } from '../item/ItemEffects';
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
export const ROLL_AGAIN = 'ROLL_AGAIN';
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
      | typeof PLAYER_ALREADY_ROLLED
      | typeof ROLL_AGAIN;
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

    // if they have both rolled the same number, roll again
    const getPlayersInitatives = duel.getPlayersInitiative();

    const allPlayersRolledSameNumber = getPlayersInitatives.every(
      (player) => player.rolledInitative === result
    );

    if (allPlayersRolledSameNumber) {
      // reset their rolled initiative and have them roll again
      duel.getParticipants().forEach((player) => {
        duel.setPlayerInititative(player.playerId, 0);
      });

      return {
        status: ROLL_AGAIN,
        result,
      };
    }

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

    const currentTurnPlayerId = duel.getCurrentTurnPlayerId();
    if (attacker.getId() !== currentTurnPlayerId) {
      return { status: NOT_ATTACKERS_TURN };
    }
    const itemEffectService = new ItemEffectService();

    const modifiers = itemEffectService.applyPreAttackEffects(
      attacker,
      defender
    );

    // round up to nearest whole number
    const roll =
      parseDieAndRoll(sidedDie) / (modifiers.defenseModifierMultiple ?? 1);
    console.log(`roll: ${roll}`);
    const doesHitTarget = Math.ceil(roll) >= defender.getAC();

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
    this.endTurn({
      duel,
      player: attacker,
      playerGoesAgain: modifiers.allowExtraAttack,
    });

    const nextPlayerId = duel.getCurrentTurnPlayerId();

    const nextPlayer = attacker.getId() === nextPlayerId ? attacker : defender;

    const {} = this.beginTurn({ duel, player: nextPlayer });

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
    modifiers?: PreAttackModifiers;
    rollModifier?: number;
    attackerHealthRemaining?: number;
    attackerDead?: boolean;
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

    const { rolls, modifier, ...rest } = getRollsWithModifiers(
      sidedDie,
      criticalHit
    );

    let total = rest.total;

    const itemEffectService = new ItemEffectService();
    const modifiers = itemEffectService.applyPreAttackEffects(
      attacker,
      defender
    );

    total *= modifiers.extraAttackDamageModifier ?? 1;

    let sepuku = false;
    // if the attacker and defender are the same player, the attacker hurts themselves
    if (attacker.getId() === defender.getId()) {
      sepuku = true;
      attacker.hurt(total);
    } else {
      // attack the target
      defender.hurt(total);
    }

    if (modifiers.reflectedDamage && !sepuku) {
      attacker.hurt(total * modifiers.reflectedDamage);
    }

    const isTargetDead = sepuku
      ? attacker.isPlayerDead()
      : defender.isPlayerDead();
    const targetHealthRemaining = sepuku
      ? attacker.getHealth()
      : defender.getHealth();
    this.endTurn({
      duel,
      player: attacker,
      playerGoesAgain: modifiers.allowExtraAttack,
    });
    const nextPlayerId = duel.getCurrentTurnPlayerId();

    const nextPlayer = attacker.getId() === nextPlayerId ? attacker : defender;

    const {} = this.beginTurn({ duel, player: nextPlayer });

    return {
      status: isTargetDead ? 'TARGET_DEAD' : 'TARGET_HIT',
      targetHealthRemaining,
      attackerHealthRemaining: attacker.getHealth(),
      attackerDead: attacker.isPlayerDead(),
      rolls,
      damage: total,
      nextPlayerId,
      rollModifier: modifier,
      modifiers,
      // Include attackerDamage if you want to inform about the damage taken by the attacker due to reflection
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
    this.endTurn({ duel, player });
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
    item,
  }: {
    duel: Duel | null;
    player: Player;
    item: Item;
  }): Promise<{
    status: typeof DUEL_NOT_FOUND | 'ITEM_USED' | 'PLAYER_NOT_FOUND';
    damage?: number;
    heal?: number;
    playerDead?: boolean;
    playerGoesAgain?: boolean;
  }> {
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
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

    if (res?.status === 'suddenStrike') {
      return {
        status: 'ITEM_USED',
        playerGoesAgain: true,
      };
    }

    duel.nextTurn();

    return {
      status: 'ITEM_USED',
      damage: res?.damage,
      heal: res?.heal,
      playerDead: player.isPlayerDead(),
    };
  }

  canUseItem({ duel, playerId }: { duel: Duel; playerId: string }): {
    status: 'ALREADY_USED_ITEM' | 'CAN_USE_ITEM';
  } {
    // make sure the player has the item and hasn't used an item this match
    const hasUsedItem = duel.hasPlayerUsedItem(playerId);

    if (hasUsedItem) {
      return {
        status: 'ALREADY_USED_ITEM',
      };
    }

    return {
      status: 'CAN_USE_ITEM',
    };
  }

  beginTurn({ duel, player }: { duel: Duel; player: Player }) {
    let res: { id: string; effect: string; amount: number }[] = [];
    const itemEffectService = new ItemEffectService();
    const { extraHeal } = itemEffectService.applyPreRoundEffects(player);

    if (extraHeal) {
      console.log(`healed ${extraHeal} to ${player.getId()}`);
      player.heal(extraHeal);
      res.push({
        id: player.getId(),
        effect: 'Healers Herb',
        amount: extraHeal,
      });
    }

    return res;
  }

  endTurn({
    duel,
    player,
    playerGoesAgain = false,
  }: {
    duel: Duel | null;
    player: Player;
    playerGoesAgain?: boolean;
  }) {
    if (!duel) {
      return {
        status: DUEL_NOT_FOUND,
      };
    }
    player.setTargetId('');
    // increment all effects
    const itemEffectService = new ItemEffectService();
    itemEffectService.decrementEffectTurns(player);
    itemEffectService.removeExpiredEffects(player);

    if (playerGoesAgain) {
      return;
    }
    duel.nextTurn();
    if (duel.isAIPlayer(duel.getCurrentTurnPlayerId())) {
      // emit the event to process the AI turn
      // this.aiDuelService.processAITurn(duel.getId(), duel.getCurrentTurnPlayerId());
    }
  }

  determineWinner(players: Player[]): { winnerId: string | null } {
    // Filter out players who are still alive
    const alivePlayers = players.filter((player) => {
      return !player.isPlayerDead();
    });

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

  getNumberOfDice(sidedDie: string, criticalHit: boolean) {
    const baseAttackNumberOfDice = parseInt(sidedDie.split('d')[0]);

    // if critical double it otherwise return the base attack
    return criticalHit ? baseAttackNumberOfDice * 2 : baseAttackNumberOfDice;
  }
}
