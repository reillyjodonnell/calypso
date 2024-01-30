import { SlashCommandBuilder } from 'discord.js';

export const goldCommand = new SlashCommandBuilder()
  .setName('gold')
  .setDescription('View your gold');

export const inventoryCommand = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('View your inventory');

export const storeCommand = new SlashCommandBuilder()
  .setName('store')
  .setDescription('Displays items available for purchase');

export const duelCommand = new SlashCommandBuilder()
  .setName('duel')
  .setDescription('Duel another user')
  .addUserOption((option) =>
    option.setName('user').setDescription('The user to duel').setRequired(true)
  );
export const acceptCommand = new SlashCommandBuilder()
  .setName('accept')
  .setDescription('Accept a duel challenge');

export const initiativeCommand = new SlashCommandBuilder()
  .setName('initiative')
  .setDescription('Roll for initiative!')
  .addStringOption((option) =>
    option
      .setName('dice')
      .setDescription('The dice to roll')
      .setRequired(true)
      .addChoices({ name: 'd20', value: 'd20' })
  );

export const rollForDamageCommand = new SlashCommandBuilder()
  .setName('roll_for_damage')
  .setDescription('Rolls for damage!')
  .addStringOption((option) =>
    option
      .setName('dice')
      .setDescription('The dice to roll')
      .setRequired(true)
      .addChoices({ name: 'd6', value: 'd6' })
  );

export const attackCommand = new SlashCommandBuilder()
  .setName('attack')
  .setDescription('Attack another player')
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('The user to attack')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('dice')
      .setDescription('Roll to hit!')
      .setRequired(true)
      .addChoices({ name: 'd20', value: 'd20' })
  );

export const healCommand = new SlashCommandBuilder()
  .setName('heal')
  .setDescription('Heal another player')
  .addUserOption((option) =>
    option.setName('user').setDescription('The user to heal').setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('dice')
      .setDescription('The dice to roll')
      .setRequired(true)
      .addChoices({ name: 'd4', value: 'd4' })
  );

export const statsCommand = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('View your stats');

export const buyCommand = new SlashCommandBuilder()
  .setName('buy')
  .setDescription('Purchase an item from the store')
  .addStringOption((option) =>
    option
      .setName('itemname')
      .setDescription('The name of the item to purchase')
      .setRequired(true)
      .setAutocomplete(true)
  ) // Enable autocomplete
  .addIntegerOption((option) =>
    option
      .setName('quantity')
      .setDescription('The quantity to purchase')
      .setRequired(false)
  ); // Quantity is optional

export const testCommand = new SlashCommandBuilder()
  .setName('test')
  .setDescription('test command');
