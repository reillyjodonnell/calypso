import { describe, expect, it } from 'bun:test';
import { CHALLENGED, CHALLENGER, Duel } from './Duel';
import { Player } from '../player/player';

describe('Duel', () => {
  it('should allow us to add players to a duel', () => {
    const duel = new Duel('duel-id');
    const challengerId = '1';
    const challengedId = '2';
    const challenger = new Player(challengerId);
    const challenged = new Player(challengedId);
    duel.addPlayer(challenger, CHALLENGER);
    duel.addPlayer(challenged, CHALLENGED);
    expect(duel.getPlayers().length).toBe(2);
    expect(duel.getId()).toBe('duel-id');

    // they should be able to accept the duel
    duel.setPlayerReady(challenger);
    duel.setPlayerReady(challenged);

    expect(duel.areAllPlayersReady()).toBe(true);

    // allow them to roll for initative
    duel.rollForInitative(challengedId, '2');
    expect(duel.haveAllPlayersRolledForInitiative()).toBe(false);
    duel.rollForInitative(challengerId, '20');
    expect(duel.haveAllPlayersRolledForInitiative()).toBe(true);

    // set the turn order
    duel.generateTurnOrder();
    expect(duel.getCurrentTurnPlayerId().getId()).toBe(challengerId);
    duel.nextTurn();
    expect(duel.getCurrentTurnPlayerId().getId()).toBe(challengedId);
    duel.nextTurn();
    expect(duel.getCurrentTurnPlayerId().getId()).toBe(challengerId);
    duel.nextTurn();
    expect(duel.getCurrentTurnPlayerId().getId()).toBe(challengedId);
    duel.nextTurn();
    expect(duel.getCurrentTurnPlayerId().getId()).toBe(challengerId);
    duel.nextTurn();
    expect(duel.getCurrentTurnPlayerId().getId()).toBe(challengedId);
    duel.nextTurn();
    expect(duel.getCurrentTurnPlayerId().getId()).toBe(challengerId);
    duel.nextTurn();
    expect(duel.getCurrentTurnPlayerId().getId()).toBe(challengedId);
  });
});
