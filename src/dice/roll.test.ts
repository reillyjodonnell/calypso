import { test, it, expect } from 'bun:test';
import { parseDieAndRoll, roll } from '.';

test('roll d20', () => {
  it('should return a number between 1 and 20', () => {
    expect(roll(20)).toBeGreaterThanOrEqual(1);
    expect(roll(20)).toBeLessThanOrEqual(20);
  });
});

test('parseDieAndRoll d20', () => {
  it('should return a number between 1 and 20', () => {
    expect(parseDieAndRoll('1d20')).toBeGreaterThanOrEqual(1);
    expect(parseDieAndRoll('1d20')).toBeLessThanOrEqual(20);
    expect(parseDieAndRoll('1d20')).toBeGreaterThanOrEqual(1);
    expect(parseDieAndRoll('1d20')).toBeLessThanOrEqual(20);
  });
});
