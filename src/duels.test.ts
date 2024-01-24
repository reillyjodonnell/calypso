import { describe, expect, it } from 'bun:test';
import { addPlayerToDuel, createDuel, getPlayersInDuel } from './duels';

describe('duels', () => {
  it('should give me the list of players in the duel by a duel id', () => {
    const duelId = createDuel('1');
    addPlayerToDuel(duelId, '1');
    addPlayerToDuel(duelId, '2');
    expect(getPlayersInDuel(duelId)).toStrictEqual(['1', '2']);
  });
});
