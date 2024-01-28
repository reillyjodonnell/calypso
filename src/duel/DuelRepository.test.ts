import { describe, it, expect } from 'bun:test';
import { Duel } from './Duel';
import { DuelRepository } from './DuelRepository';

describe('DuelRepository', () => {
  it('should save an instance of a duel', () => {
    const duel = new Duel('id');
    const duelRepository = new DuelRepository();
    duel.addPlayer('1');
    duel.addPlayer('2');
    duelRepository.save(duel);
    const savedDuel = duelRepository.getById(duel.getId());
    expect(savedDuel?.getId()).toBe(duel.getId());
  });
});
