import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { Weapon } from '../item/weapon';

export function createStoreEmbed(weapons: Weapon[]) {
  const storeEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('🏛️ Ares Armory 🏛️')
    .setDescription(
      'Welcome to the armory! Here you can purchase weapons to aid you in your battles.'
    )
    .addFields(
      { name: '\u200B', value: '\u200B' },
      // {
      //   name: '🌟 Featured Items (resets in 06:12:32)',
      //   value:
      //     'Items bestowed with divine powers, available for a limited time.',
      // },
      // ...featuredItems.map((item) => ({
      //   name: `${item.emoji} ${item.name}`,
      //   value: `${item.description}\nPrice: ${item.price}`,
      //   inline: true,
      // })),
      // { name: '\u200B', value: '\u200B' },
      { name: '🛡️ Basic Items', value: 'Essential items for any warrior.' },
      ...weapons.map((item) => ({
        name: `${item.getEmoji()} ${item.getName()}`,
        value: `${item.getDescription()}\nPrice: ${item.getPrice()}`,
        inline: true,
      })),
      { name: '\u200B', value: '\u200B' }
    )
    .setFooter({ text: 'Use buttons below to purchase.' });

  const buttons = weapons.map((item) => {
    return new ButtonBuilder()
      .setCustomId(`buy_${item.getId()}`)
      .setLabel(`${item.getEmoji()} Buy ${item.getName()}`)
      .setStyle(ButtonStyle.Primary);
  });

  // Organize buttons into rows (max 5 buttons per row)
  const buttonRows = [];
  for (let i = 0; i < buttons.length; i += 3) {
    const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 3));
    buttonRows.push(row);
  }

  return {
    embed: storeEmbed,
    components: buttonRows,
  };
}
