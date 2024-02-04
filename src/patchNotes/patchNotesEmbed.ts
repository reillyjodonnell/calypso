import { EmbedBuilder } from 'discord.js';

export const patchNotesEmbed = new EmbedBuilder()
  .setColor('#0099ff') // A cool, professional blue color for clarity and focus
  .setTitle('🔧 Ares Duel Arena Patch Notes 🔧')
  .setDescription(
    'Stay updated with the latest changes, improvements, and new features in the Ares Duel Arena!'
  )
  .addFields(
    {
      name: '🛠️ Bug Fixes',
      value:
        '1. Fixed a bug where duel results were not displaying correctly.\n' +
        '2. Resolved an issue with the inventory system not updating.\n' +
        '3. Adjusted the match-making algorithm for fairer duels.',
      inline: false,
    },
    {
      name: '🌟 New Features',
      value:
        '1. Added new legendary weapons to the Store.\n' +
        '2. Introduced a ranking system for top duelists.\n' +
        '3. Implemented daily login rewards for active players.',
      inline: false,
    },
    {
      name: '🔮 Upcoming Updates',
      value:
        '1. Planning a new arena environment for epic battles.\n' +
        '2. Working on a guild system for team duels.\n' +
        '3. Exploring options for custom character skins.',
      inline: false,
    }
  )
  .setThumbnail(
    'https://raw.githubusercontent.com/reillyjodonnell/ares/main/assets/patch_notes_icon.png' // A thematic icon representing patch notes
  )
  .setTimestamp() // Adds the current time to the footer
  .setFooter({
    text: 'Thank you for being a part of the Ares Duel Arena community!',
  });
