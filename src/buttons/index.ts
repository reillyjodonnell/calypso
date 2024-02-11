import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export function getAllButtonOptions({
  guildId,
  channelId,
  userId,
  attackId,
  healId,
  leaveId,
}: {
  guildId: string | null;
  channelId: string | null;
  userId: string | null;
  attackId: number;
  healId: number;
  leaveId: number;
}) {
  if (!guildId || !channelId || !userId)
    throw new Error('Missing guildId, channelId, or userId');
  const attackButton = createAttackButton(
    createButtonId({
      action: 'attack',
      guildId: guildId,
      threadId: channelId,
      counter: attackId,
    }),
    false
  );
  const healButton = createHealButton(
    createButtonId({
      action: 'heal',
      guildId: guildId,
      threadId: channelId,
      counter: healId,
    }),
    false
  );
  const statsButton = createStatsButton(
    createButtonId({
      action: 'stats',
      guildId: guildId,
      threadId: channelId,
      counter: leaveId,
    }),
    false
  );
  const useButton = createUseButton(
    createButtonId({
      action: 'use',
      guildId: guildId,
      threadId: channelId,
      counter: leaveId,
    }),
    false
  );
  const row = new ActionRowBuilder().addComponents(
    attackButton,
    healButton,
    statsButton,
    useButton
  );
  return row;
}

export function createButtonId({
  guildId,
  threadId,
  counter,
  action,
}: {
  guildId: string | null;
  threadId: string | null;
  counter: number;
  action: string;
}) {
  if (!guildId) {
    throw new Error('Missing guildId');
  }
  if (!threadId) {
    throw new Error('Missing threadId');
  }

  if (!action) {
    throw new Error('Missing action');
  }

  const uniqueId = `${guildId}/${threadId}/${action}/${counter}`;
  return uniqueId;
}

export function parseButtonId(id: string) {
  // handle turn that may be included in the id
  const [guildId, threadId, action, counter] = id.split('/');
  return { guildId, threadId, action, counter };
}

export function createAcceptButton(id: string, isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Accept')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('✅')
    .setDisabled(isDisabled);
}

export function createRejectButton(id: string, isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Reject')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(isDisabled);
}

export function createAttackButton(id: string, isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Attack')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('⚔️')
    .setDisabled(isDisabled);
}
export function createHealButton(id: string, isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Heal')
    .setStyle(ButtonStyle.Success) // Green color for heal
    .setEmoji('❤️')
    .setDisabled(isDisabled);
}

export function createStatsButton(id: string, isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Stats')
    .setStyle(ButtonStyle.Secondary) // Gray color for stats
    .setEmoji('📊')
    .setDisabled(isDisabled);
}
export function createLeaveButton(id: string, isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Leave')
    .setStyle(ButtonStyle.Danger) // Red color for leave
    .setEmoji('🏃')
    .setDisabled(isDisabled);
}
export function createInventoryButton(id: string, isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Inventory')
    .setStyle(ButtonStyle.Secondary) // Red color for leave
    .setEmoji('🎒')
    .setDisabled(isDisabled);
}

export function createUseButton(id: string, isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Use')
    .setStyle(ButtonStyle.Secondary) // Red color for leave
    .setEmoji('🔮')
    .setDisabled(isDisabled);
}

export function createRollButton(id: string, isDisabled: boolean = false) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Roll')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🎲')
    .setDisabled(isDisabled);
}

export function createWagerButton(id: string, isDisabled: boolean = false) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Wager')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('💰')
    .setDisabled(isDisabled);
}
