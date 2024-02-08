import { describe, beforeEach, it, expect } from 'bun:test';
import { Duel } from './Duel';
import { Player } from '../player/player';
import { DuelService } from './DuelService';

describe('rollForDamage', () => {
  let duel: Duel;
  let attacker: Player;
  let defender: Player;
  let sidedDie: string;
  let duelService = new DuelService();
  const DUEL_NOT_FOUND = 'DUEL_NOT_FOUND';
  const PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND';
  const TARGET_DEAD = 'TARGET_DEAD';
  const TARGET_HIT = 'TARGET_HIT';

  beforeEach(() => {
    // Set up mock objects and default values
    duel = createMockDuel();
    attacker = createMockPlayer('1');
    defender = createMockPlayer('2');
    sidedDie = '1d6'; // Example sided die
  });

  it('should return the users damage', () => {
    attacker.setDamage('1d6');
    const result = duelService.rollFordamage({
      duel,
      attacker,
      defender,
      sidedDie,
      criticalHit: false,
    });

    expect(result.roll).toBeLessThanOrEqual(6);
  });

  // Additional tests for other scenarios...
});

function createMockDuel() {
  return new Duel('1');
}

function createMockPlayer(id: string) {
  return new Player(id);
}

describe('determine winner', () => {
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
