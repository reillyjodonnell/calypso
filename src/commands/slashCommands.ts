import { SlashCommandBuilder } from 'discord.js';

//REGULAR
export const goldCommand = new SlashCommandBuilder()
  .setName('gold')
  .setDescription('View your gold');

export const inventoryCommand = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('View your inventory');

export const duelCommand = new SlashCommandBuilder()
  .setName('duel')
  .setDescription('Duel another user')
  .addUserOption((option) =>
    option.setName('user').setDescription('The user to duel').setRequired(true)
  );

export const leaderboardCommand = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('View the leaderboard');
