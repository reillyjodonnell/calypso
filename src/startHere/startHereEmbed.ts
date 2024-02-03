import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

export const startHereEmbed = new EmbedBuilder()
  .setColor('#FF4500') // A vibrant orange color for excitement and energy
  .setTitle('🎉🛡️ Welcome to the Ares Duel Arena! 🗡️🎉')
  .setDescription(
    '🌟 Embark on an unforgettable journey of strength, strategy, and courage. Join the Ares Duel Game and rise to become a legend! 🌟'
  )
  .addFields(
    {
      name: '⚔️ Duel for Gold!',
      value:
        'Win 5 gold for each duel victory! Challenge opponents with `/duel` and claim your riches! 💰',
      inline: false,
    },
    {
      name: '🎒 Gear Up!',
      value:
        'Upgrade your arsenal in the Store channel or with `/inventory`. Prepare for victory! 🛡️',
      inline: false,
    },
    {
      name: '🔮 Place Your Bets',
      value:
        'Feeling confident? Bet on duels or even on yourself! May fortune favor the bold! 🎲',
      inline: false,
    },
    {
      name: '🤝 Challenge a Warrior',
      value:
        'Type `/duel [player]` to initiate a heroic battle. Let the best warrior win! 🏆',
      inline: false,
    },
    {
      name: '📅 Daily Challenges Await',
      value:
        'Visit the Daily Challenges channel for new quests every day! Complete them for rewards and glory! 🌟',
      inline: false,
    }
  )
  .setThumbnail(
    'https://raw.githubusercontent.com/reillyjodonnell/ares/fd54b6937bb36d69c0c8588d27bbf0c9987d1baa/avatar.png' // Consider updating for more dynamic engagement
  )
  .setColor('#FF4500') // Consistent vibrant color for footer
  .setFooter({
    text: 'React with ✅ to enter the battleground and carve your path to glory!',
  });

// Create a button
const enterArenaButton = new ButtonBuilder()
  .setCustomId('enter_arena')
  .setLabel('Enter Arena')
  .setStyle(ButtonStyle.Primary);

// Create an ActionRow to put the button in
export const enterArenaButtonComponent = new ActionRowBuilder().addComponents(
  enterArenaButton
);
