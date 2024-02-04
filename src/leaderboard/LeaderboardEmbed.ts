import { EmbedBuilder } from 'discord.js';

type LeaderboardPlayer = {
  value: string;
  score: number;
};

export type LeaderboardData = LeaderboardPlayer[];

export function getEmptyLeaderboardEmbed() {
  return new EmbedBuilder()
    .setColor('#FF4500') // A vibrant orange color for excitement and energy
    .setTitle('🏆 Ares Duel Arena Leaderboard 🏆')

    .addFields({
      name: 'No one is on the leaderboard yet!',
      value: 'Go claim the crown!',
      inline: false,
    })
    .setThumbnail(
      'https://raw.githubusercontent.com/reillyjodonnell/ares/fd54b6937bb36d69c0c8588d27bbf0c9987d1baa/avatar.png' // Consider updating for more dynamic engagement
    )
    .setFooter({
      text: `Leaderboard resets daily at midnight EST. May the best warrior win! 🌟`,
    });
}

export function getLeaderboardEmbed(data: LeaderboardData) {
  const embed = new EmbedBuilder()
    .setColor('#FF4500') // A vibrant orange color for excitement and energy
    .setTitle('🏆 Ares Duel Arena Leaderboard 🏆')
    .setDescription(
      '👑 Behold the champions of the arena! Who shall claim the throne today? 👑'
    )
    .addFields(
      data.map((player, index) => ({
        name: `${player.value}`,
        value: `🏅 Duels Won: ${player.score}`,
        inline: false,
      }))
    )
    .setThumbnail(
      'https://raw.githubusercontent.com/reillyjodonnell/ares/fd54b6937bb36d69c0c8588d27bbf0c9987d1baa/avatar.png' // Consider updating for more dynamic engagement
    )
    .setFooter({
      text: `Leaderboard resets daily at midnight EST. May the best warrior win! 🌟`,
    });

  return embed;
}
