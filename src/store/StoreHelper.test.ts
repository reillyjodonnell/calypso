import { describe, expect, it } from 'bun:test';
import { parseIdFromStoreAction } from './storeHelper';

describe('parsing id from action', () => {
  it('should parse the number', () => {
    const id1 = parseIdFromStoreAction('action_1');
    expect(id1).toBe('1');

    const id22 = parseIdFromStoreAction('action_22');
    expect(id22).toBe('22');
    // ...
  });
});
