import {
  Channel,
  Client,
  EmbedBuilder,
  GuildBasedChannel,
  Interaction,
} from 'discord.js';
import { DiscordService } from '../discord/DiscordService';

const LEADERBOARD_CHANNEL_ID = '1203731406627405864';

export class DiscordLeaderboardService {
  async writeToLeaderboardChannel(
    channel: GuildBasedChannel,
    embed: EmbedBuilder
  ) {
    if (!channel) {
      throw new Error('Leaderboard channel not found');
    }

    // make sure the channel is a text channel
    if (!channel.isTextBased()) {
      throw new Error('Leaderboard channel is not a text channel');
    }

    // send the embed to the channel
    await channel.send({ embeds: [embed] });
  }

  async writeToLeaderboardChannelWithMessage({
    client,
    embed,
    message,
  }: {
    client: Client;
    embed: EmbedBuilder;
    message: string;
  }) {
    // find the leaderboard channel
    let channel: Channel | undefined | null = client.channels.cache.find(
      (channel) => channel.id === LEADERBOARD_CHANNEL_ID
    );

    if (!channel) {
      // make a fetch
      channel = await client.channels.fetch(LEADERBOARD_CHANNEL_ID);
    }

    if (!channel) {
      throw new Error('Leaderboard channel not found');
    }

    // make sure the channel is a text channel
    if (!channel.isTextBased()) {
      throw new Error('Leaderboard channel is not a text channel');
    }

    // send the embed to the channel
    await channel.send({ content: message, embeds: [embed] });
  }
}
