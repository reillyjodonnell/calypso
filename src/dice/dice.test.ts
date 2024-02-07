import { describe, expect, it } from 'bun:test';
import { parseModifier } from './dice';

describe('getRollsWithModifiers', () => {});

describe('parsing modifier', () => {
  it('should parse modifier and return as a number', () => {
    const roll = '1d20 + 3';
    const result = parseModifier(roll);
    expect(result).toBe(3);
  });
  it('should also for negative', () => {
    const roll = '1d20 - 43';
    const result = parseModifier(roll);
    expect(result).toBe(-43);
  });
  it('should default 0 when not provided', () => {
    const roll = '1d20';
    const result = parseModifier(roll);
    expect(result).toBe(0);
  });
});
