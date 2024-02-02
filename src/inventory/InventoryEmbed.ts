import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { Weapon } from '../item/weapon';

export function createInventoryEmbed(
  playerId: string,
  inventory: Weapon[] | null
) {
  // return an empty inventory message if the user has no items
  if (!inventory || inventory.length === 0) {
    const emptyInventoryEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🎒 Your Inventory 🎒')
      .setDescription(
        'Your inventory is empty. Go to the store to buy some items!'
      );
    return {
      embed: emptyInventoryEmbed,
      components: [],
    };
  }
  const inventoryEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('🎒 Your Inventory 🎒')
    .setDescription('These are the items you have collected:')
    .addFields(
      ...inventory.map((item) => ({
        name: `${item.getEmoji()} ${item.getName()}`,
        value: item.getDescription(),
        inline: true,
      }))
    );
  const inventoryButtons = inventory.map((item) =>
    new ButtonBuilder()
      .setCustomId(createInventoryButtonId({ playerId, itemId: item.getId() }))
      .setLabel(
        `${item.getEmoji()} ${
          item.getEquipped() ? 'Unequip' : 'Equip'
        } ${item.getName()}`
      )
      .setStyle(
        item.getEquipped() ? ButtonStyle.Secondary : ButtonStyle.Primary
      )
  );

  const buttonRows = [];
  for (let i = 0; i < inventoryButtons.length; i += 3) {
    const row = new ActionRowBuilder().addComponents(
      inventoryButtons.slice(i, i + 3)
    );
    buttonRows.push(row);

    return {
      embed: inventoryEmbed,
      components: buttonRows,
    };
  }
}

export function parseInventoryButtonId(id: string) {
  const [action, playerId, itemId] = id.split('/');
  return { action, playerId, itemId };
}

export function createInventoryButtonId({
  playerId,
  itemId,
}: {
  playerId: string;
  itemId: string;
}) {
  if (!playerId) {
    throw new Error('Missing playerId');
  }

  if (!itemId) {
    throw new Error('Missing item id');
  }
  const action = 'use';

  const uniqueId = `${action}/${playerId}/${itemId}/${Date.now().toString()}`;
  return uniqueId;
}
