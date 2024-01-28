import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { nanoid } from 'nanoid';

export function createAcceptButton(id: string, isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Accept')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(isDisabled);
}

export function createRejectButton(id: string, isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Reject')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(isDisabled);
}

export function createAttackButton(isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(nanoid())
    .setLabel('Attack')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(isDisabled);
}
export function createHealButton(isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(nanoid())
    .setLabel('Heal')
    .setStyle(ButtonStyle.Success) // Green color for heal
    .setDisabled(isDisabled);
}
export function createLeaveButton(id: string, isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Leave')
    .setStyle(ButtonStyle.Danger) // Red color for leave
    .setDisabled(isDisabled);
}
export function createInventoryButton(isDisabled: boolean) {
  return new ButtonBuilder()
    .setCustomId(nanoid())
    .setLabel('Inventory')
    .setStyle(ButtonStyle.Secondary) // Red color for leave
    .setDisabled(isDisabled);
}
