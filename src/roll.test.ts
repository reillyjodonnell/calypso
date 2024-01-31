import { test, it, expect } from 'bun:test';
import { roll } from '../dice/dice.ts';

test('roll d20', () => {
  it('should return a number between 1 and 20', () => {
    expect(roll(20)).toBeGreaterThanOrEqual(1);
    expect(roll(20)).toBeLessThanOrEqual(20);
  });
});
