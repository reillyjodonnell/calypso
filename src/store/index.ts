const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

// this should come from a db
const featuredItems = [
  {
    name: 'Elixir of Ares',
    emoji: '🔮',
    id: 'elixir_of_ares',
    description: 'Heals 2d4 health points.',
    price: '100 gold',
  },
  {
    name: 'Cloak of Shadows',
    emoji: '🌫️',
    id: 'cloak_of_shadows',
    description: 'Grants temporary invisibility.',
    price: '150 gold',
  },
  {
    name: 'Ring of Fortitude',
    emoji: '💍',
    id: 'ring_of_fortitude',
    description: '+2ac against first attack.',
    price: '120 gold',
  },
];
const standardItems = [
  {
    name: 'Sword',
    emoji: '⚔️',
    id: 'sword',
    description: '1d6 attack',
    price: '50 gold',
  },
  {
    name: 'Warhammer',
    emoji: '🔨',
    id: 'warhammer',
    description: '1d8 attack',
    price: '70 gold',
  },
  {
    name: 'Bow',
    emoji: '🏹',
    id: 'bow',
    description: '2d4 attack',
    price: '60 gold',
  },
  {
    name: 'Staff',
    emoji: '🔱',
    id: 'staff',
    description: '1d6 attack',
    price: '50 gold',
  },
];

export const storeEmbed = new EmbedBuilder()
  .setColor(0x0099ff)
  .setTitle('🏛️ Ares Armory 🏛️')
  .setDescription(
    'Welcome to the armory of the gods! Here are the items available for purchase:'
  )
  .addFields(
    { name: '\u200B', value: '\u200B' },
    {
      name: '🌟 Featured Items (resets in 06:12:32)',
      value: 'Items bestowed with divine powers, available for a limited time.',
    },
    featuredItems.map((item) => ({
      name: `${item.emoji} ${item.name}`,
      value: `${item.description}\nPrice: ${item.price}`,
      inline: true,
    })),
    { name: '\u200B', value: '\u200B' },
    { name: '🛡️ Basic Items', value: 'Essential items for any warrior.' },
    standardItems.map((item) => ({
      name: `${item.emoji} ${item.name}`,
      value: `${item.description}\nPrice: ${item.price}`,
      inline: true,
    }))
  )
  .setFooter({ text: 'Use /buy [item_name] to purchase an item.' });

const buttons = [...featuredItems, ...standardItems].map((item) =>
  new ButtonBuilder()
    .setCustomId(`buy_${item.id}`)
    .setLabel(`${item.emoji} Buy ${item.name}`)
    .setStyle(ButtonStyle.Primary)
);

export function getButtonRows() {
  // Organize buttons into rows (max 5 buttons per row)
  const buttonRows = [];
  for (let i = 0; i < buttons.length; i += 3) {
    const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 3));
    buttonRows.push(row);
  }
  return buttonRows;
}