import {
  ChannelType,
  ChatInputCommandInteraction,
  Guild,
  GuildBasedChannel,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
const DUEL_CHANNEL_NAME = 'duel';

export class DiscordService {
  async sendMessageToChannel(channel: GuildBasedChannel, message: string) {
    if (channel.isTextBased()) {
      channel.send({ content: message });
    }
  }

  async createDuelThread({
    guild,
    challengerId,
    challengedId,
  }: {
    guild: Guild | null;
    challengerId: string;
    challengedId: string;
  }): Promise<ThreadChannel> {
    if (!guild) throw new Error('No guild');

    let duelChannel = guild.channels.cache.find(
      (channel) =>
        channel.name === DUEL_CHANNEL_NAME &&
        channel.type === ChannelType.GuildText
    );

    // If the duel channel doesn't exist, create it
    if (!duelChannel) {
      duelChannel = await guild.channels.create({
        name: DUEL_CHANNEL_NAME,
        type: ChannelType.GuildText,
        reason: 'Needed a channel for duels',
      });
    }

    // Check if duelChannel is a TextChannel, if not, throw an error
    if (!(duelChannel instanceof TextChannel)) {
      throw new Error('Duel channel is not a text channel');
    }

    const threadName = `Duel-${challengerId}-vs-${challengedId}`;
    const duelThread = await duelChannel.threads.create({
      name: threadName,
      autoArchiveDuration: 60, // Adjust as needed
      reason: 'Creating a new thread for a duel',
    });

    return duelThread;
  }

  async findDuelThread(
    guild: Guild | null,
    threadId: string
  ): Promise<ThreadChannel | null> {
    if (!guild) throw new Error('No guild');

    // Try to find the thread directly by its ID
    let duelThread = guild.channels.cache.get(threadId) as
      | ThreadChannel
      | undefined;

    if (!duelThread || !duelThread.isThread()) {
      return null;
    }

    return duelThread;
  }

  async verifyDuelThread(
    interaction: ChatInputCommandInteraction,
    expectedThreadId: string
  ): Promise<boolean> {
    if (!interaction.guild) return false;

    const duelThread = await this.findDuelThread(
      interaction.guild,
      interaction.channelId
    );

    return duelThread !== null && interaction.channelId === expectedThreadId;
  }

  async findOrCreateDuelThread(guild: Guild | null, duelId: string) {
    if (!guild) throw new Error('No guild');

    // Find the dedicated duel channel, ensuring it's a text channel
    const duelChannel = guild.channels.cache.find(
      (channel) =>
        channel.name === DUEL_CHANNEL_NAME &&
        channel.type === ChannelType.GuildText
    );

    if (!duelChannel) {
      throw new Error('Duel channel not found');
    }

    // Ensure that the channel is a text channel that can have threads
    if (!(duelChannel instanceof TextChannel)) {
      throw new Error('Duel channel is not a text channel');
    }

    // Find an existing thread with the given duelId or create a new one
    let duelThread = duelChannel.threads.cache.find(
      (thread) => thread.name === duelId
    );

    if (!duelThread) {
      // Create a new thread in the duel channel
      duelThread = await duelChannel.threads.create({
        name: duelId,
        autoArchiveDuration: 60, // Duration in minutes, or choose another suitable value
        reason: 'Creating a new thread for a duel',
      });
    }

    return duelThread;
  }

  async findOrCreateDuelChannel(guild: Guild | null, duelId: string) {
    if (!guild) throw new Error('No guild');
    if (guild.channels.cache.size === 0)
      throw new Error('No channels in guild');
    const duelChannel = guild.channels.cache.find(
      (channel) => channel.name === duelId
    );
    if (duelChannel) return duelChannel;
    const newDuelChannel = await guild.channels.create({
      name: DUEL_CHANNEL_NAME,
      type: ChannelType.GuildText,
      reason: 'Needed a channel for duels',
    });
    return newDuelChannel;
  }
}
