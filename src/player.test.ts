import { describe, expect, it } from 'bun:test';
import { PlayerManager } from './player';

describe('player manager', () => {
  const manager = new PlayerManager();
  manager.addPlayer('1');
  manager.addPlayer('2');

  it('should have both players', () => {
    expect(manager.getPlayers().length).toBe(2);
  });

  const playerOne = manager.getPlayer('1');
  const playerTwo = manager.getPlayer('2');

  playerOne?.setInitiative(10);
  playerTwo?.setInitiative(20);

  it('should have all players marked as rolled for initiative', () => {
    expect(manager.haveAllPlayersRolledForinitiative()).toBe(true);
  });
});
