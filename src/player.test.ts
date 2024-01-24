import { describe, expect, it } from 'bun:test';
import { PlayerManager } from './player';

describe('player manager', () => {
  const manager = new PlayerManager();
  manager.addPlayer('1');
  manager.addPlayer('2');

  it('should have both players', () => {
    expect(manager.getPlayers().length).toBe(2);
  });
});
