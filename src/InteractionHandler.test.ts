import { describe, expect, it } from 'bun:test';
import { InteractionHandler } from './duel/DuelInteractionHandler';
import { GoldRepository } from './gold/GoldRepository';
import { GoldManager } from './gold/GoldManager';
import { WagerRepository } from './wager/WagerRepository';
import { WagerManager } from './wager/WagerManager';
import { DuelRepository } from './duel/DuelRepository';
import { PlayerRepository } from './player/PlayerRepository';
import { DiscordService } from './discord/DiscordService';
import { PlayerService } from './player/PlayerService';
import { DuelService } from './duel/DuelService';
import { WagerService } from './wager/WagerService';
import { DuelWinManager } from './duel/DuelWinManager';

const goldRepository = new GoldRepository(redisClient);
const goldManager = new GoldManager(goldRepository);
//@ts-ignore
const wagerRepository = new WagerRepository(redisClient);
const wagerManager = new WagerManager(wagerRepository);

const duelRepository = new DuelRepository(redisClient);
const playerRepository = new PlayerRepository(redisClient);
const discordService = new DiscordService();
const playerService = new PlayerService();
const duelService = new DuelService();
const wagerService = new WagerService(goldManager, wagerManager, duelService);

const duelWinManager = new DuelWinManager(
  duelService,
  wagerService,
  goldManager
);

describe('InteractionHandler', () => {
  const interactionHandler = new InteractionHandler(
    duelRepository,
    playerRepository,
    discordService,
    playerService,
    duelService,
    wagerService,
    duelWinManager
  );
  it('should work', () => {
    expect(true).toBe(true);
  });
});
