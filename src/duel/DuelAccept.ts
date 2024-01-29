import { Guild } from 'discord.js';
import { DiscordService } from '../discord/DiscordService';
import { DuelService } from './DuelService';

export class DuelAccept {
  constructor(private duelsServicesMap: Map<any, any>) {}

  async accept(guild: Guild | null, channelId: string, userId: string) {
    const discordService = new DiscordService();
    const duelThread = await discordService.findDuelThread(guild, channelId);

    if (!duelThread || channelId !== duelThread.id) {
      return {
        status: 'INVALID_CHANNEL',
      };
    }
    if (!duelThread) {
      throw new Error('Duel thread not found');
    }
    const { duelService } = this.duelsServicesMap.get(duelThread.id);

    const { status, ids, count } = duelService.acceptDuel({
      challengedId: userId,
      duelId: duelThread.id,
    });

    return { status, ids, duelThread, count };
  }
}
