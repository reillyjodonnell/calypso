import { describe, expect, it } from 'bun:test';
import { NOT_A_VALID_NUMBER, WagerService } from './WagerService';

describe('WagerService', () => {
  it('should return NOT_A_VALID_NUMBER status if the amount is not a valid number', async () => {
    const wagerService = new WagerService();
    const result = await wagerService.createWager({
      amount: 'not a number',
      threadId: '123',
      guildId: '123',
      userId: '123',
      bettingOn: '123',
    });

    expect(result?.status).toEqual(NOT_A_VALID_NUMBER);
  });
});
