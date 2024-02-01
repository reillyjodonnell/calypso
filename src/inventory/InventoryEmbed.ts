import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

// This should come from the user's inventory data in your database
const userInventory: InventoryItem[] = [
  {
    name: 'Mystic Bow',
    emoji: '🏹',
    id: 'mystic_bow',
    description: '2d6 attack, long range',
  },
  {
    name: 'Iron Warhammer',
    emoji: '🔨',
    id: 'iron_warhammer',
    description: '1d10 attack, heavy',
    active: true,
  },
  // ... other inventory items
];

interface InventoryItem {
  name: string;
  emoji: string;
  id: string;
  description: string;
  active?: boolean;
}

export const inventoryEmbed = new EmbedBuilder()
  .setColor(0x0099ff)
  .setTitle('🎒 Your Inventory 🎒')
  .setDescription('These are the items you have collected:')
  .addFields(
    ...userInventory.map((item) => ({
      name: `${item.emoji} ${item.name}`,
      value: item.description,
      inline: true,
    }))
  );

const inventoryButtons = userInventory.map((item) =>
  new ButtonBuilder()
    .setCustomId(`use_${item.id}`)
    .setLabel(`${item.emoji} ${item.active ? 'Unequip' : 'Equip'} ${item.name}`)
    .setStyle(item.active ? ButtonStyle.Secondary : ButtonStyle.Primary)
);

export function getInventoryButtonRows() {
  const buttonRows = [];
  for (let i = 0; i < inventoryButtons.length; i += 3) {
    const row = new ActionRowBuilder().addComponents(
      inventoryButtons.slice(i, i + 3)
    );
    buttonRows.push(row);
  }
  return buttonRows;
}
