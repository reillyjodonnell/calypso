import { EmbedBuilder } from 'discord.js';

export const serverRulesEmbed = new EmbedBuilder()
  .setColor('#00BFFF') // A calming blue color representing trust and stability
  .setTitle('📜 Server Rules and Guidelines 📜')
  .setDescription(
    'Welcome to our community! To ensure a safe and enjoyable experience for everyone, please adhere to the following rules.'
  )
  .addFields(
    {
      name: '1. Be Respectful',
      value:
        'Treat all members with respect and kindness. No bullying, harassment, or hate speech.',
      inline: false,
    },
    {
      name: '2. No Explicit Content',
      value:
        'Avoid sharing content that is offensive, explicit, or NSFW. Keep the community safe for everyone.',
      inline: false,
    },
    {
      name: '3. No Spamming',
      value:
        'Refrain from spamming messages, emojis, or links. Keep the chat readable and enjoyable.',
      inline: false,
    },
    {
      name: '4. Stay on Topic',
      value:
        'Keep discussions relevant to the channel topics. This helps maintain order and organization.',
      inline: false,
    },
    {
      name: '5. No Self-Promotion',
      value:
        'Self-promotion and advertising are not allowed without permission from the moderators.',
      inline: false,
    }
  )
  .setThumbnail(
    'https://raw.githubusercontent.com/reillyjodonnell/ares/fd54b6937bb36d69c0c8588d27bbf0c9987d1baa/avatar.png' // Consider updating for more dynamic engagement
  )
  .setColor('#00BFFF') // Consistent color for footer
  .setFooter({
    text: 'Thank you for being a part of our community! Enjoy your stay!',
  });
