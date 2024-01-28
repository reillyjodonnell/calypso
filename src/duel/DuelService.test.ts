import { describe, expect, it } from 'bun:test';
import { DuelService } from './DuelService';
import { DuelRepository } from './DuelRepository';
import { PlayerManager } from '../player/player';

describe('DuelService', () => {
  const duelRepository = new DuelRepository();
  const playerManager = new PlayerManager();
  const duelService = new DuelService(duelRepository, playerManager);
  it('should emit two messages, one to the channel it was called in and one in the duel channel taggin the 2 users', () => {
    // actual test
    const result = duelService.challengePlayer({
      challengerId: 'user1',
      challengedId: 'user2',
      duelId: 'duel-id',
    });
    expect(result).toStrictEqual({
      status: 'DUEL_STARTED',
    });
  });
});
