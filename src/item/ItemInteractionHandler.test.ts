import { describe, expect, it } from 'bun:test';
import { ItemInteractionHandler } from './ItemInteractionHandler';
import { createItemsButtonId } from './ItemsEmbed';

describe('ItemInteractionHandler', () => {
  it('should handle items', () => {
    const handler = new ItemInteractionHandler({
      inventoryRepository: {} as any,
      discordService: {} as any,
      duelRepository: {} as any,
      duelService: {} as any,
      playerRepository: {} as any,
      duelWinManager: {} as any,
      duelCleanup: {} as any,
    });
    const customId = createItemsButtonId({
      itemId: '1',
      playerId: '123',
    });
    const interaction = {
      customId: 'some-custom-id',
      channelId: 'some-channel-id',
      reply: () => Promise.resolve(),
    } as any;
    handler.handleItem(interaction);
  });
});
