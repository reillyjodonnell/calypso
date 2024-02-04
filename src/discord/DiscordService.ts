import {
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Guild,
  GuildBasedChannel,
  PermissionFlagsBits,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import { SettledWager } from '../wager/WagerService';
import {
  enterArenaButtonComponent,
  startHereEmbed,
} from '../startHere/startHereEmbed';
import { createStoreEmbed } from '../store';
import { Weapon } from '../item/weapon';
const DUEL_CHANNEL_NAME = 'duels';

export class DiscordService {
  async getGuild(client: Client) {
    const guildId = process.env.GUILD_ID;
    if (!guildId) throw new Error('No guild id in .env');
    let guild = client.guilds.cache.get(guildId);
    if (!guild) {
      guild = await client.guilds.fetch(guildId);

      throw new Error('Guild not found');
    }
    return guild;
  }
  async initializeServer(guild: Guild | null, weapons: Weapon[]) {
    if (!guild) return console.log('Guild not found');

    // if the store category doesn't exist, create it

    let gladiatorRole = guild.roles.cache.find(
      (role) => role.name === '🛡️ Gladiator'
    );

    if (!gladiatorRole) {
      gladiatorRole = await guild.roles.create({
        color: 'Green',
        name: '🛡️ Gladiator',
        hoist: true,
        mentionable: false,
        reason: 'Role for accessing specific channels',
      });
    }

    // look if category exists from discord api
    console.log('Creating store category!');
    // Create 'store' category
    const storeCategory = await guild.channels.create({
      name: 'store',
      type: ChannelType.GuildCategory, // 4 is for GUILD_CATEGORY
    });

    // Set permissions for 'store' category
    // allow the bot to edit it/ post messages
    storeCategory.permissionOverwrites.edit(process.env.CALYPSO_ID as string, {
      ViewChannel: true,
      EmbedLinks: true,
      SendMessages: true,
      Administrator: true,
      ManageRoles: true,
      ManageChannels: true,
    });
    storeCategory.permissionOverwrites.edit(guild.id, { ViewChannel: false });
    storeCategory.permissionOverwrites.edit(gladiatorRole.id, {
      ViewChannel: true,
      ReadMessageHistory: true,
    });
    // Create '🛒-store' channel inside 'store' category
    const storeChannel = await guild.channels.create({
      name: '🛒-store',
      type: ChannelType.GuildText, // 0 is for GUILD_TEXT
      parent: storeCategory.id, // Use the ID of the category
    });

    // post embed to the store channel
    const { components, embed } = createStoreEmbed(weapons);

    // Send the store embed to the store channel
    storeChannel.send({ embeds: [embed], components: components as any });

    // Create 'daily' category
    const dailyCategory = await guild.channels.create({
      name: '📆 daily challenges',
      type: ChannelType.GuildCategory, // 4 is for GUILD_CATEGORY
    });

    // Set permissions for 'daily' category
    // allow the bot to edit it/ post messages
    dailyCategory.permissionOverwrites.edit(process.env.CALYPSO_ID as string, {
      ViewChannel: true,
      EmbedLinks: true,
      SendMessages: true,
      Administrator: true,
      ManageRoles: true,
      ManageChannels: true,
    });
    dailyCategory.permissionOverwrites.edit(guild.id, { ViewChannel: false });
    dailyCategory.permissionOverwrites.edit(gladiatorRole.id, {
      ViewChannel: true,
      ReadMessageHistory: true,
    });

    // Create '📆-daily-challenge' channel inside 'daily' category
    const dailyChallengeChannel = await guild.channels.create({
      name: '📆-daily-challenge',
      type: ChannelType.GuildText, // 0 is for GUILD_TEXT
      parent: dailyCategory.id, // Use the ID of the category
    });

    // if the duel category doesn't exist
    // create it
    const duelCategory = await guild.channels.create({
      name: '⚔️ duels',
      type: 4, // 4 is for GUILD_CATEGORY
    });

    console.log('Server initialized successfully.');
  }

  async createStartHereMessage(guild: Guild) {
    // look for the ✅-start-here channel
    let startHereChannel = guild.channels.cache.find(
      (channel) => channel.name === '✅-start-here'
    );
    const calypsoId = process.env.CALYPSO_ID;
    if (!calypsoId) throw new Error('No CALYPSO_ID not supplied in .env');
    if (!startHereChannel) {
      startHereChannel = await guild.channels.create({
        name: '✅-start-here',
        type: ChannelType.GuildText,
        reason: 'Needed a channel for new players to start',
        permissionOverwrites: [
          {
            id: guild.roles.everyone, // @everyone role
            // I want the bot and admins to be able to send messages

            deny: [PermissionFlagsBits.SendMessages], // Deny send messages
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AddReactions,
            ], // Allow view, read history, and add reactions
          },
          {
            id: calypsoId, // Replace with your Bot role ID, if you have one
            allow: [PermissionFlagsBits.SendMessages], // Allow send messages to Bot role
          },
        ],
      });
      // append the embedded message to the startHereChannel
      const embedMessage = startHereEmbed;
      // react to it with the checkmark
      const sentMessage = await startHereChannel.send({
        embeds: [embedMessage],
        components: [enterArenaButtonComponent as any],
      });
    }
  }
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

    // Ensure the '⚔️ duels' category exists
    let duelCategory = guild.channels.cache.find(
      (c) => c.name === '⚔ duels' && c.type === ChannelType.GuildCategory
    );

    if (!duelCategory) {
      duelCategory = await guild.channels.create({
        name: '⚔️ duels',
        type: ChannelType.GuildCategory,
        reason: 'Needed a category for duels',
      });
    }

    if (!duelCategory) {
      throw new Error('No duel category');
    }

    // Find or create the '⚔️-duels' text channel within the category
    let duelChannel = guild.channels.cache.find(
      (channel) =>
        channel.name === '⚔-duels' &&
        channel.type === ChannelType.GuildText &&
        channel.parentId === duelCategory?.id
    );

    if (!duelChannel) {
      console.log("duel cateogry doesn't exist");
      duelChannel = await guild.channels.create({
        name: '⚔️-duels',
        type: ChannelType.GuildText,
        parent: duelCategory.id,
        reason: 'Needed a text channel for duels',
      });
    }

    // Check if duelChannel is a TextChannel, if not, throw an error
    if (!(duelChannel instanceof TextChannel)) {
      throw new Error('Duel channel is not a text channel');
    }

    // Fetch the 🛡️ Gladiator role
    const gladiatorRole = guild.roles.cache.find(
      (role) => role.name === '🛡️ Gladiator'
    );
    if (!gladiatorRole) {
      throw new Error('🛡️ Gladiator role not found');
    }

    // Set permissions for the thread
    await duelChannel.permissionOverwrites.set([
      {
        id: guild.id, // Default permissions for everyone in the guild
        deny: ['ViewChannel'], // Deny access to everyone by default
      },
      {
        id: gladiatorRole.id, // Permissions for the 🛡️ Gladiator role
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'], // Allow specific permissions
      },
      {
        id: process.env.CALYPSO_ID as string, // Permissions for the bot's highest role
        allow: [
          'ManageThreads',
          'ViewChannel',
          'SendMessages',
          'ReadMessageHistory',
          'Administrator',
        ], // Bot should have all permissions to manage the thread
      },
      // Add additional permission overwrites for admins if needed
    ]);

    // Create a thread in the '⚔️-duels' text channel
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

  //wager

  showWagerResults(settledWagers: SettledWager[], winningPlayerId: string) {
    if (settledWagers.length === 0) return null;
    // Create an embed
    const betResultsEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Bet Results')
      .setDescription(
        `Results for bets on the winning player: <@${winningPlayerId}>`
      );

    // Add fields for each winning bet
    betResultsEmbed.addFields(
      settledWagers.map(
        ({ amountWagered, betOnPlayerId, playerId, winnings }, index) => {
          const winStatement = `<@${playerId}> bet on <@${betOnPlayerId}> and won ${winnings} gold!`;
          const loseStatement = `<@${playerId}> bet on <@${betOnPlayerId}> and lost ${amountWagered} gold.`;

          return {
            name: `Bet ${index + 1}`,
            value:
              winningPlayerId === betOnPlayerId ? winStatement : loseStatement,
            inline: true,
          };
        }
      )
    );

    return betResultsEmbed;
  }

  // daily challenge shit

  async findOrCreateDailyChallengeChannel(client: Client, guildId: string) {
    const guild = await client.guilds.fetch(guildId);

    // Ensure the daily challenge channel exists
    let channel = client.guilds.cache.find(
      (channel) => channel.name === '💪-daily-challenge'
    );

    if (!channel) {
      await guild.channels.create({
        name: '💪-daily-challenge',
        type: ChannelType.GuildText,
      });
    }
  }
}
