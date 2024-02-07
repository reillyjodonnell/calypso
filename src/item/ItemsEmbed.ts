import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { Item } from './Item';
import { nanoid } from 'nanoid';

export function getItemsEmbed({
  items,
  playerId,
}: {
  items: Item[];
  playerId: string;
}) {
  const itemsEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('🎒 Your items 🎒')
    .setDescription('Use any of the items below!')
    .addFields(
      ...items.map((item) => ({
        name: `${item.getEmoji()} ${item.getName()}`,
        value: item.getDescription(),
        inline: true,
      }))
    );
  const itemsButtons = items.map((item) =>
    new ButtonBuilder()
      .setCustomId(createItemsButtonId({ itemId: item.getId(), playerId }))
      .setLabel(`${item.getEmoji()} ${item.getName()}`)
      .setStyle(ButtonStyle.Secondary)
  );

  const buttonRows = [];
  for (let i = 0; i < itemsButtons.length; i += 3) {
    const row = new ActionRowBuilder().addComponents(
      itemsButtons.slice(i, i + 3)
    );
    buttonRows.push(row);
  }

  return {
    embed: itemsEmbed,
    components: buttonRows,
  };
}

export function createItemsButtonId({
  itemId,
  playerId,
}: {
  itemId: string;
  playerId: string;
}) {
  if (!itemId) {
    throw new Error('Missing item id');
  }
  const action = 'item';
  return `${action}/${playerId}/${itemId}/${nanoid()}`;
}

export function parseItemsButtonId(id: string) {
  const [action, playerId, itemId] = id.split('/');
  return { action, playerId, itemId };
}
