import { CacheType, ChatInputCommandInteraction, Client } from 'discord.js';
import { DiscordLeaderboardService } from './DiscordLeaderboardService';
import {
  getEmptyLeaderboardEmbed,
  getLeaderboardEmbed,
} from './LeaderboardEmbed';
import { LeaderboardService } from './LeaderboardService';
import { GoldManager } from '../gold/GoldManager';
import { DiscordService } from '../discord/DiscordService';

export class LeaderboardApplicationService {
  private discordService = new DiscordService();
  private discordLeaderboardService = new DiscordLeaderboardService();
  constructor(
    private leaderboardService: LeaderboardService,
    private goldManager: GoldManager
  ) {}

  async recordWin(userId: string) {
    await this.leaderboardService.increment(userId, 1);
    return;
  }

  async replyWithTop10(interaction: ChatInputCommandInteraction<CacheType>) {
    const embed = await this.getTop10Embed(interaction);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async getTop10Embed(interaction: ChatInputCommandInteraction<CacheType>) {
    const result = await this.leaderboardService.getTop10();

    if (!result || result.length === 0) {
      return getEmptyLeaderboardEmbed();
    }

    let formattedWithName: { value: string; score: number }[] = [];
    for (const player of result) {
      const user = interaction.guild?.members.cache.get(player.value);
      if (user) {
        formattedWithName.push({
          value: user.displayName,
          score: player.score,
        });
      } else {
        formattedWithName.push({
          value: player.value,
          score: player.score,
        });
      }
    }

    // get the embed
    const embed = getLeaderboardEmbed(formattedWithName);

    return embed;
  }

  async displayTop10ToChannel(client: Client) {
    const result = await this.leaderboardService.getTop10();
    const guild = await this.discordService.getGuild(client);
    if (!guild) {
      console.error('Guild not found');
      return;
    }
    if (!result) {
      console.error('No one is on the leaderboard yet!');
      return;
    }

    let formattedWithName: { value: string; score: number }[] = [];
    for (const player of result) {
      const user = guild.members.cache.get(player.value);
      if (user) {
        formattedWithName.push({
          value: user.displayName,
          score: player.score,
        });
      } else {
        formattedWithName.push({
          value: player.value,
          score: player.score,
        });
      }
    }

    const embed = getLeaderboardEmbed(formattedWithName);

    // find the leaderboard channel
    const channel = guild?.channels.cache.find(
      (channel) => channel.id === process.env.LEADERBOARD_CHANNEL_ID
    );

    if (!channel) {
      console.error('Leaderboard channel not found');
      return;
    }

    // write the embed to the leaderboard channel
    await this.discordLeaderboardService.writeToLeaderboardChannel(
      channel,
      embed
    );
  }

  async processLeaderboardReset(client: Client) {
    const result = await this.leaderboardService.getTop10();

    const guild = await this.discordService.getGuild(client);
    if (!guild) {
      console.error('Guild not found');
      return;
    }
    if (!result) {
      console.error('No one is on the leaderboard yet!');
      return;
    }

    let formattedWithName: { value: string; score: number }[] = [];
    for (const player of result) {
      const user = guild.members.cache.get(player.value);
      if (user) {
        formattedWithName.push({
          value: user.displayName,
          score: player.score,
        });
      } else {
        formattedWithName.push({
          value: player.value,
          score: player.score,
        });
      }
    }

    const embed = getLeaderboardEmbed(formattedWithName);

    // make sure we have at least 3 people on the leaderboard
    if (result.length < 3) {
      console.error('Not enough people on the leaderboard');
      return;
    }

    const firstPlace = result[0].value;
    const secondPlace = result[1].value;
    const thirdPlace = result[2].value;

    // get the rewards for the winners
    const firstPlaceReward = 20;
    const secondPlaceReward = 10;
    const thirdPlaceReward = 5;

    const todayDate = new Date().toLocaleDateString('en-US');
    const rewardsMessage =
      `🏆 **Duel Arena Leaderboard Update - ${todayDate}!** 🏆\n\n` +
      `The epic battles have concluded, and the champions of the arena have emerged! Here are our top gladiators:\n\n` +
      `🥇 **1st Place**: <@${firstPlace}> with an impressive ${result[0].score} wins! Awarded ${firstPlaceReward} gold! 🌟\n` +
      `🥈 **2nd Place**: <@${secondPlace}> with a strong ${result[1].score} wins! Awarded ${secondPlaceReward} gold! 💫\n` +
      `🥉 **3rd Place**: <@${thirdPlace}> with a valiant ${result[2].score} wins! Awarded ${thirdPlaceReward} gold! ✨\n\n` +
      `Congratulations to our champions! Your skill and bravery are unmatched. 🗡️\n\n` +
      `The leaderboard has been reset, and the arena awaits new challengers. Who will rise to glory next? 🛡️🔥\n\n`;

    // send the embed to the channel
    await this.discordLeaderboardService.writeToLeaderboardChannelWithMessage({
      embed,
      client,
      message: rewardsMessage,
    });

    // award gold to the top 3. first place gets 20 second place gets 10 and third place gets 5
    await this.goldManager.awardGold(firstPlace, firstPlaceReward);
    await this.goldManager.awardGold(secondPlace, secondPlaceReward);
    await this.goldManager.awardGold(thirdPlace, thirdPlaceReward);

    await this.leaderboardService.resetLeaderboard();
  }
}
