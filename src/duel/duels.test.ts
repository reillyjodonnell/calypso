import { describe, expect, it } from 'bun:test';
import { Duels } from './duels';

describe('duels', () => {
  it('should track the list of duels I have', () => {
    const duels = new Duels();
    duels.createDuel('duel1');
    duels.getDuelById('duel1');
    expect(duels.getDuelById('duel1')).toBeDefined();
  });
});
