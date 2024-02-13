import { describe, expect, it } from 'bun:test';

import { AIInteractionHandler } from './AIInteractionHandler';

describe('AIInteractionHandler', () => {
  it('should be able to listen for AI turns and process them', () => {
    const handler = new AIInteractionHandler();
    handler.listenForAITurn('duelId', 'aiId');
  });
});
