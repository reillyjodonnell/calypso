import { describe, beforeEach, it, expect, mock } from 'bun:test';
import { Duel } from './Duel';
import { Player } from '../player/player';
import { DuelService } from './DuelService';
import { Item } from '../item/Item';
import { parseDieAndRoll } from '../dice/dice';

describe('rollForDamage', () => {
  let duel: Duel;
  let attacker: Player;
  let defender: Player;
  let sidedDie: string;
  let duelService = new DuelService();

  beforeEach(() => {
    // Set up mock objects and default values
    duel = createMockDuel();
    attacker = createMockPlayer('1');
    defender = createMockPlayer('2');
    sidedDie = '1d6'; // Example sided die
  });

  it('should return the users damage', () => {
    attacker.setDamage('1d6');
    const { status, rolls } = duelService.rollFordamage({
      duel,
      attacker,
      defender,
      sidedDie,
      criticalHit: false,
    });
    if (status === 'TARGET_HIT' || status === 'TARGET_DEAD') {
      expect(rolls?.reduce((a, b) => a + b)).toBeLessThanOrEqual(6);
    }
  });

  // Additional tests for other scenarios...
});

function createMockDuel() {
  return new Duel('1');
}

function createMockPlayer(id: string) {
  return new Player(id);
}

describe('when rolling for initative', () => {
  it('should return the player with the highest roll', () => {
    mock.module('../dice/dice', () => {
      return {
        parseDieAndRoll: mock(parseDieAndRoll).mockReturnValue(4),
      };
    });
    const duel = new Duel('1');
    const player1 = new Player('1');
    const player2 = new Player('2');
    duel.addPlayer(player1.getId(), 'CHALLENGER');
    duel.addPlayer(player2.getId(), 'CHALLENGED');

    duel.setPlayerInititative(player1.getId(), 10);
    // duel.setPlayerInititative(player2.getId(), 5);

    const duelService = new DuelService();
    // I've hardcodded that a 4 is rolled
    const { status, playerToGoFirst, result } = duelService.rollForInitiative({
      duel,
      playerId: player2.getId(),
      sidedDie: '1d20',
    });

    expect(playerToGoFirst).toBe(player1.getId());
    expect(status).toBe('ALL_PLAYERS_ROLLED');
  });
  it("should prompt users to roll again if they've rolled the same number", () => {
    mock.module('../dice/dice', () => {
      return {
        parseDieAndRoll: mock(parseDieAndRoll).mockReturnValue(4),
      };
    });
    const duel = new Duel('1');
    const player1 = new Player('1');
    const player2 = new Player('2');
    duel.addPlayer(player1.getId(), 'CHALLENGER');
    duel.addPlayer(player2.getId(), 'CHALLENGED');

    duel.setPlayerInititative(player1.getId(), 4);

    const duelService = new DuelService();
    const { status, playerToGoFirst, result } = duelService.rollForInitiative({
      duel,
      playerId: player2.getId(),
      sidedDie: '1d20',
    });

    expect(playerToGoFirst).not.toBeDefined();
    expect(status).toBe('ROLL_AGAIN');

    // each players roll should be allowed to roll again
    expect(duel.hasAnyPlayerRolledForInitiative()).toBe(false);
  });
});

describe('determine winner', () => {
  it('should return the other players id when 1 of the 2 dies', () => {
    mock.module('../dice/dice', () => {
      return {
        parseDieAndRoll: mock(parseDieAndRoll).mockReturnValue(19),
      };
    });
    const duel = new Duel('1');
    const attacker = new Player('1');
    const defender = new Player('2');
    duel.addPlayer(attacker.getId(), 'CHALLENGER');
    duel.addPlayer(defender.getId(), 'CHALLENGED');
    duel.setTurnOrder([attacker.getId(), defender.getId()]);
    attacker.setHealth(1);
    defender.setHealth(1);
    const duelService = new DuelService();
    duelService.attemptToHit({
      duel,
      attacker,
      defender,
      sidedDie: '1d20',
    });

    const { status } = duelService.rollFordamage({
      duel,
      attacker,
      defender,
      sidedDie: '1d6',
      criticalHit: false,
    });

    expect(status).toBe('TARGET_DEAD');
    expect(defender.getHealth()).toBe(0);
    expect(attacker.getHealth()).toBe(1);

    const { winnerId } = new DuelService().determineWinner([
      attacker,
      defender,
    ]);
    expect(winnerId).toBe(attacker.getId());
  });
  it('should return the right user when someone kills themselves', () => {
    const duel = new Duel('1');
    const attacker = new Player('1');
    const defender = new Player('2');
    attacker.setHealth(0);
    defender.setHealth(1);

    const { winnerId } = new DuelService().determineWinner([
      attacker,
      defender,
    ]);
    expect(winnerId).toBe(defender.getId());
  });
});

describe('Using the sudden strike should allow user to attack twice in one turn and result in 50% less damage for the second attack (if they hit)', () => {
  // we're hard coding that every roll is 18
  mock.module('../dice/dice', () => {
    return {
      parseDieAndRoll: mock(parseDieAndRoll).mockReturnValue(18),
    };
  });

  it('Should allow them to hit twice', () => {
    const duel = new Duel('duel-id');

    const player = new Player('Player 1');
    duel.addPlayer(player.getId(), 'CHALLENGER');
    const enemy = new Player('Player 2');
    duel.addPlayer(enemy.getId(), 'CHALLENGED');

    // set the duel turn order up so that player 1 can go
    duel.setTurnOrder([player.getId(), enemy.getId()]);

    const item = new Item(
      'sudden-strike',
      '🗡️',
      'Sudden Strike',
      'weapon',
      'rare',
      'Allows user to attack twice in one turn and result in 50% less damage for the second attack (if they hit)',
      1000
    );

    const duelService = new DuelService();
    duelService.useItem({ duel, player, item });

    //  now the player should be able to attack once and then be able to attack again
    const {
      status: firstHitStatus,
      nextPlayerId: nextPlayerIdAfterFirstHit,
      roll,
    } = duelService.attemptToHit({
      duel,
      attacker: player,
      defender: enemy,
      sidedDie: '1d20',
    });

    console.log('roll: ', roll);

    if (firstHitStatus === 'ATTACK_HITS') {
      const {
        nextPlayerId: nextPlayerIdAfterFirstDamage,
        modifiers: firstDamModifiers,
      } = duelService.rollFordamage({
        duel,
        attacker: player,
        defender: enemy,
        sidedDie: '1d6',
        criticalHit: false,
      });
      expect(firstDamModifiers?.extraAttackDamageModifier).toBe(0.5);
      expect(nextPlayerIdAfterFirstDamage).toBe(player.getId());
    }

    // they should be able to go again
    const secondHit = duelService.attemptToHit({
      duel,
      attacker: player,
      defender: enemy,
      sidedDie: '1d20',
    });

    if (secondHit.status === 'ATTACK_HITS') {
      const { nextPlayerId: nextPlayerIdAfterSecondDamage } =
        duelService.rollFordamage({
          duel,
          attacker: player,
          defender: enemy,
          sidedDie: '1d6',
          criticalHit: firstHitStatus === 'CRITICAL_HIT',
        });

      expect(nextPlayerIdAfterSecondDamage).toBe(enemy.getId());
    }

    // if player 2 uses an item they should also get to go twice for attacks
    duelService.useItem({ duel, player: enemy, item });

    //  now the player should be able to attack once and then be able to attack again
    const {
      status: firstHitStatus2,
      nextPlayerId: nextPlayerIdAfterFirstHit2,
    } = duelService.attemptToHit({
      duel,
      attacker: enemy,
      defender: player,
      sidedDie: '1d20',
    });

    if (firstHitStatus2 === 'ATTACK_HITS') {
      const { nextPlayerId: nextPlayerIdAfterFirstDamage2 } =
        duelService.rollFordamage({
          duel,
          attacker: enemy,
          defender: player,
          sidedDie: '1d6',
          criticalHit: false,
        });
      expect(nextPlayerIdAfterFirstDamage2).toBe(enemy.getId());
    }

    // they should be able to go again
    const secondHit2 = duelService.attemptToHit({
      duel,
      attacker: enemy,
      defender: player,
      sidedDie: '1d20',
    });

    if (secondHit2.status === 'ATTACK_HITS') {
      const { nextPlayerId: nextPlayerIdAfterSecondDamage2 } =
        duelService.rollFordamage({
          duel,
          attacker: enemy,
          defender: player,
          sidedDie: '1d6',
          criticalHit: false,
        });

      expect(nextPlayerIdAfterSecondDamage2).toBe(player.getId());
    }

    // Now since both users have gone and used an item they are uneligable to use an item and will
    // only get 1 turn each

    //third attack
    const thirdHit = duelService.attemptToHit({
      duel,
      attacker: player,
      defender: enemy,
      sidedDie: '1d20',
    });

    if (thirdHit.status === 'ATTACK_HITS') {
      const { nextPlayerId: nextPlayerIdAfterThirdDamage } =
        duelService.rollFordamage({
          duel,
          attacker: player,
          defender: enemy,
          sidedDie: '1d6',
          criticalHit: false,
        });

      expect(nextPlayerIdAfterThirdDamage).toBe(enemy.getId());
    }
  });

  // there should be no errors / fails
});

describe('Using the Mirror Shield ', () => {
  mock(parseDieAndRoll).mockReturnValue(18);
  it('Should reflect 50% of the damage back to the attacker', () => {
    const duel = new Duel('duel-id');
    const attacker = new Player('Player 1');
    duel.addPlayer(attacker.getId(), 'CHALLENGER');
    const enemy = new Player('Player 2');
    duel.addPlayer(enemy.getId(), 'CHALLENGED');

    // set the duel turn order up so that player 1 can go
    duel.setTurnOrder([attacker.getId(), enemy.getId()]);
    const duelService = new DuelService();
    const item = new Item(
      'mirror-shield',
      '🛡️',
      'Mirror Shield',
      'armor',
      'rare',
      'Reflects 50% of the damage back to the attacker',
      1000
    );

    duelService.useItem({ duel, player: attacker, item });

    //  now the player should be able to attack once and then be able to attack again
    const { status: firstHitStatus, nextPlayerId: nextPlayerIdAfterFirstHit } =
      duelService.attemptToHit({
        duel,
        attacker,
        defender: enemy,
        sidedDie: '1d20',
      });

    if (firstHitStatus === 'ATTACK_HITS') {
      const { nextPlayerId: nextPlayerIdAfterFirstDamage } =
        duelService.rollFordamage({
          duel,
          attacker,
          defender: enemy,
          sidedDie: '1d6',
          criticalHit: false,
        });

      expect(nextPlayerIdAfterFirstDamage).toBe(enemy.getId());
    }

    // when the enemy goes and successfully does damage it should reflect their damage
    const {
      status: firstHitStatus2,
      nextPlayerId: nextPlayerIdAfterFirstHit2,
    } = duelService.attemptToHit({
      duel,
      attacker: enemy,
      defender: attacker,
      sidedDie: '1d20',
    });

    if (firstHitStatus2 === 'ATTACK_HITS') {
      const attackerHealthBefore = attacker.getHealth();
      const {
        status,
        nextPlayerId: nextPlayerIdAfterFirstDamage2,
        attackerHealthRemaining,
      } = duelService.rollFordamage({
        duel,
        attacker: enemy,
        defender: attacker,
        sidedDie: '1d6',
        criticalHit: false,
      });
      if (status === 'TARGET_HIT' || status === 'TARGET_DEAD') {
        if (attackerHealthRemaining) {
          expect(attackerHealthBefore).toBeGreaterThan(attackerHealthRemaining);
        }
      }
    }
  });
});

describe('Using the Healers herb', () => {
  mock.module('../dice/dice', () => {
    return {
      parseDieAndRoll: mock(parseDieAndRoll).mockReturnValue(4),
    };
  });
  it('Should give the user 3 health every round', () => {
    const HEALTH_PER_ROUND = 3;

    const duel = new Duel('duel-id');
    // player starts with 2 health
    const attacker = new Player('Player 1');
    attacker.setHealth(2);
    const attackerStartingHealthAt2 = attacker.getHealth();
    duel.addPlayer(attacker.getId(), 'CHALLENGER');
    const enemy = new Player('Player 2');
    duel.addPlayer(enemy.getId(), 'CHALLENGED');

    // set the duel turn order up so that player 1 can go
    duel.setTurnOrder([attacker.getId(), enemy.getId()]);
    const duelService = new DuelService();
    const healersHerb = new Item(
      'healers-herb',
      '🌿',
      "Healer's Herb",
      'healing',
      'rare',
      'Heals 3 health every round',
      1000
    );

    let rounds = 0;

    duelService.useItem({ duel, player: attacker, item: healersHerb });

    // first round
    duelService.attemptToHit({
      duel,
      attacker,
      defender: enemy,
      sidedDie: '1d20',
    });

    // round has ended
    rounds += 1;

    expect(attacker.getHealth()).toBe(
      attackerStartingHealthAt2 + rounds * HEALTH_PER_ROUND
    );

    const defenderHealth = enemy.getHealth();
    duelService.attemptToHit({
      duel,
      attacker: enemy,
      defender: attacker,
      sidedDie: '1d20',
    });
    expect(enemy.getHealth()).toBe(defenderHealth);

    // second round

    duelService.attemptToHit({
      duel,
      attacker,
      defender: enemy,
      sidedDie: '1d20',
    });

    rounds += 1;
    const isOpponentTurn = duel.getCurrentTurnPlayerId() === enemy.getId();
    expect(isOpponentTurn).toBe(true);

    expect(attacker.getHealth()).toBe(
      attackerStartingHealthAt2 + rounds * HEALTH_PER_ROUND
    );
  });
});
