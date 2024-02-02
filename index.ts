import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  InteractionType,
  ActionRowBuilder,
  TextInputStyle,
  APIEmbed,
} from 'discord.js';
import { DuelService } from './src/duel/DuelService';
import { DiscordService } from './src/discord/DiscordService';
import { DuelRepository } from './src/duel/DuelRepository';
import {
  duelCommand,
  storeCommand,
  acceptCommand,
  attackCommand,
  healCommand,
  initiativeCommand,
  rollForDamageCommand,
  statsCommand,
  buyCommand,
  testCommand,
  goldCommand,
  inventoryCommand,
  initCommand,
} from './src/commands';
import { parseButtonId } from './src/buttons';
import { createStoreEmbed } from './src/store';
import { createClient } from 'redis';
import { GoldRepository } from './src/gold/GoldRepository';
import { RedisClientType } from '@redis/client';
import { GoldManager } from './src/gold/GoldManager';
import { ModalBuilder, TextInputBuilder } from '@discordjs/builders';
import { createWagerId, parseWagerId } from './src/wager/wagerHelper';
import {
  NOT_A_VALID_NUMBER,
  WAGER_PLACED,
  WagerService,
} from './src/wager/WagerService';
import { WagerManager } from './src/wager/WagerManager';
import { WagerRepository } from './src/wager/WagerRepository';
import { DuelInteractionHandler } from './src/duel/DuelInteractionHandler';
import { PlayerRepository } from './src/player/PlayerRepository';
import { PlayerService } from './src/player/PlayerService';
import { DuelWinManager } from './src/duel/DuelWinManager';
import { StoreInteractionHandler } from './src/store/StoreInteractionHandler';
import { InventoryRepository } from './src/inventory/InventoryRepository';
import { StoreRepository } from './src/store/StoreRepository';
import { DuelCleanup } from './src/duel/DuelCleanup';
import {
  createInventoryEmbed,
  parseInventoryButtonId,
} from './src/inventory/InventoryEmbed';
import { Weapon } from './src/item/weapon';
import { UserService } from './src/user/UserService';
import { InventoryService } from './src/inventory/InventoryService';

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing TOKEN or CLIENT_ID');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

const redisClient = createClient({
  url: process.env.REDIS_URL,
}) as RedisClientType;
redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.on('connect', (stream) => {
  console.log('Redis client connected');
});
await redisClient.connect();

// Repositories

//@ts-ignore
const goldRepository = new GoldRepository(redisClient);
const goldManager = new GoldManager(goldRepository);
//@ts-ignore
const wagerRepository = new WagerRepository(redisClient);
const wagerManager = new WagerManager(wagerRepository);

const duelRepository = new DuelRepository(redisClient);
const playerRepository = new PlayerRepository(redisClient);

// Clean up
const duelCleanup = new DuelCleanup(
  wagerRepository,
  duelRepository,
  playerRepository
);

const discordService = new DiscordService();
const playerService = new PlayerService();
const duelService = new DuelService();
const wagerService = new WagerService(goldManager, wagerManager, duelService);

const duelWinManager = new DuelWinManager(
  duelService,
  wagerService,
  goldManager,
  discordService
);
const inventoryRepository = new InventoryRepository(redisClient);

const dualInteractionHandler = new DuelInteractionHandler(
  duelRepository,
  playerRepository,
  playerService,
  duelService,
  discordService,
  duelWinManager,
  duelCleanup,
  inventoryRepository
);
const storeRepository = new StoreRepository();
const storeInteractionHandler = new StoreInteractionHandler(
  goldRepository,
  inventoryRepository,
  storeRepository
);

const userService = new UserService(inventoryRepository, storeRepository);
const inventoryService = new InventoryService(inventoryRepository);

try {
  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: [
      storeCommand,
      duelCommand,
      acceptCommand,
      rollForDamageCommand,
      healCommand,
      attackCommand,
      initiativeCommand,
      statsCommand,
      buyCommand,
      testCommand,
      goldCommand,
      inventoryCommand,
      initCommand,
    ],
  });
} catch (error) {
  console.log(error);
  console.error(error);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('error', (err) => {
  console.error('client error', err);
});

client.on('guildMemberAdd', async (member) => {
  const userId = member.id;
  await userService.initializeUser(userId);
});

client.on('interactionCreate', async (interaction) => {
  const discordService = new DiscordService();
  if (!interaction.channelId) throw new Error('interaction.channelId is null');

  if (interaction.type === InteractionType.ModalSubmit) {
    // const { action, guildId, threadId } = parseButtonId(interaction.customId);
    const { threadId, playerToBetOn, action, guildId } = parseWagerId(
      interaction.customId
    );

    if (action === 'wager_modal') {
      const wageredAmount =
        interaction.fields.getTextInputValue('wager_amount');

      const duelThread = await discordService.findDuelThread(
        interaction.guild,
        interaction?.channelId
      );
      if (!duelThread) throw new Error('duelThread is null');

      const { status } = await wagerService.createWager({
        amount: wageredAmount,
        threadId,
        guildId,
        userId: interaction.user.id,
        bettingOn: playerToBetOn,
      });

      if (status === NOT_A_VALID_NUMBER) {
        await interaction.reply({
          content: `Bet failed. Invalid number supplied`,
          ephemeral: true,
        });
      }

      if (status === WAGER_PLACED) {
        await interaction.reply({
          content: `<@${interaction.user.id}> wagered ${wageredAmount} coins on <@${playerToBetOn}>. Good luck!`,
        });
      }
    }
  }

  if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
    if (interaction.commandName === 'buy') {
      const focusedOption = interaction.options.getFocused(true);

      if (focusedOption.name === 'itemname') {
        const choices = [
          'Elixir of Ares',
          'Cloak of Shadows',
          'Ring of Fortitude',
          'Sword',
          'Shield',
          'Armor',
          'Regular Potion',
        ];
        const filtered = choices.filter((choice) =>
          choice.startsWith(focusedOption.value)
        );
        await interaction.respond(
          filtered.map((choice) => ({ name: choice, value: choice }))
        );
      }
    }
  }

  if (interaction.isStringSelectMenu()) {
    const selectedIds = interaction.values;
    const firstSelectedId = selectedIds[0];

    const { action } = parseButtonId(interaction.customId);

    switch (action) {
      case 'attack':
        await dualInteractionHandler.handleAttackTargetSelected(interaction);
        break;
      case 'heal':
        await dualInteractionHandler.handleHeal(interaction);
        break;
      case 'wager':
        const whoTheyBetOn = firstSelectedId;
        // Create the modal
        const modal = new ModalBuilder()
          .setCustomId(
            createWagerId({
              action: 'wager_modal',
              guildId: interaction.guildId,
              threadId: interaction.channelId,
              playerToBetOn: whoTheyBetOn,
            })
          )
          .setTitle('Wager');
        // Add components to modal
        const textInput =
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('wager_amount')
              .setMinLength(1)
              .setStyle(TextInputStyle.Short)
              .setLabel('How much do you want to wager?')
          );

        modal.addComponents(textInput);
        // Show the modal to the user
        try {
          await interaction.showModal(modal);
        } catch (err) {
          console.error(err);
        }
        break;
    }
  }

  if (interaction.isButton()) {
    const { action, guildId, threadId } = parseButtonId(interaction.customId);
    if (action === 'wager') {
      dualInteractionHandler.handleWager(interaction);
      return;
    }
    switch (action) {
      case 'accept': {
        dualInteractionHandler.acceptDuel(interaction);
        break;
      }
      case 'initiative': {
        dualInteractionHandler.handleRollForInitiative(interaction);
        break;
      }
      case 'attack':
      case 'heal':
        await dualInteractionHandler.promptForTargetForHealOrAttack(
          interaction
        );
        break;
      case 'roll_for_damage': {
        await dualInteractionHandler.handleRollForDamage(interaction);
        break;
      }
      case 'roll_for_damage_2x': {
        await dualInteractionHandler.handleRollForDamage(
          interaction,
          // critical hit
          true
        );
        break;
      }
    }
    const storeAction = interaction.customId;
    console.log('store action:', storeAction);
    // inventory
    if (storeAction.startsWith('use')) {
      const { action, itemId, playerId } = parseInventoryButtonId(storeAction);
      const item = await inventoryRepository.getItem(playerId, itemId);
      if (!item) {
        await interaction.reply({
          content: 'Item not found.',
          ephemeral: true,
        });
        return;
      }
      const weapons = await inventoryRepository.getItems(playerId);
      if (!weapons) {
        await interaction.reply({
          content: 'No weapons found.',
          ephemeral: true,
        });
        return;
      }
      if (item instanceof Weapon) {
        inventoryService.equipWeapon({ weapons, playerId, weaponId: itemId });
        interaction.reply({
          content: `You've equipped the ${item.getName()}`,
          ephemeral: true,
        });
      }
    }

    switch (storeAction) {
      // STORE
      case 'buy_1': {
        await storeInteractionHandler.handleStorePurchase(interaction, '1');
        break;
      }
      case 'buy_2': {
        await storeInteractionHandler.handleStorePurchase(interaction, '2');
        break;
      }
      case 'buy_3': {
        await storeInteractionHandler.handleStorePurchase(interaction, '3');
        break;
      }
      case 'buy_4': {
        await storeInteractionHandler.handleStorePurchase(interaction, '4');
        break;
      }
      case 'buy_5': {
        await storeInteractionHandler.handleStorePurchase(interaction, '5');
        break;
      }
      case 'buy_6': {
        await storeInteractionHandler.handleStorePurchase(interaction, '6');
        break;
      }
      case 'buy_7': {
        await storeInteractionHandler.handleStorePurchase(interaction, '7');
        break;
      }

      // equipment
    }
  }

  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'store': {
      const weapons = await storeRepository.getItems();
      const { components, embed } = createStoreEmbed(weapons);
      await interaction.reply({
        embeds: [embed],
        components: [...(components as any)],
        ephemeral: true,
      });
      break;
    }
    case 'init': {
      if (!interaction?.memberPermissions?.has('Administrator')) {
        await interaction.reply({
          ephemeral: true,
          content: 'Sorry, you do not have the necessary permissions.',
        });
        return;
      }

      const user = interaction.options.getUser('user');
      if (!user) {
        await interaction.reply('User not found.');
        return;
      }
      await userService.initializeUser(user.id);
      await interaction.reply({
        content: `Initialized user with id: ${user.id}`,
        ephemeral: true,
      });

      break;
    }
    case 'inventory': {
      const items = await inventoryRepository.getItems(interaction.user.id);
      const channelId = interaction.channelId;
      const res = createInventoryEmbed(interaction.user.id, items);
      if (!res) return;

      await interaction.reply({
        embeds: [res.embed],
        components: [...(res.components as any)],
        ephemeral: true,
      });
      break;
    }
    case 'buy': {
      break;
    }

    case 'stats': {
      // retrieve that players stats from the db
      // const playerStats = getPlayerStats(interaction.user.id); // Implement this function based on your data structure
      function getPlayerStats() {
        return {
          name: 'Ares',
          level: 1,
          health: 14,
          maxHealth: 14,
          ac: 11,
          strength: 10,
          dexterity: 10,
          currentXP: 0,
          nextLevelXP: 100,
        };
      }
      const playerStats = getPlayerStats();
      const infoEmbed = new EmbedBuilder()
        .setColor(0x00ae86) // Set a color for the embed
        .setTitle(`${playerStats.name}'s Character Stats`)
        .addFields(
          { name: 'Level', value: playerStats.level.toString(), inline: true },
          {
            name: 'Health',
            value: `${playerStats.health}/${playerStats.maxHealth} HP`,
            inline: true,
          },
          { name: 'AC', value: playerStats.ac.toString(), inline: true },
          // Add more fields for other stats like Strength, Dexterity, etc.
          {
            name: 'Strength',
            value: playerStats.strength.toString(),
            inline: true,
          },
          {
            name: 'Dexterity',
            value: playerStats.dexterity.toString(),
            inline: true,
          },
          // ... include other relevant stats
          {
            name: 'Experience Points',
            value: `${playerStats.currentXP}/${playerStats.nextLevelXP} XP`,
            inline: false, // This might be better as a non-inline field for clarity
          }
        )
        .setFooter({ text: 'Stay strong in the arena!' });

      await interaction.reply({ embeds: [infoEmbed] });
      break;
    }

    case 'duel': {
      await dualInteractionHandler.handleDuel(interaction);
      break;
    }

    case 'gold': {
      const gold = await goldManager.getGold(interaction.user.id);
      await interaction.reply({
        content: `You have ${gold} gold.`,
        ephemeral: true,
      });
      break;
    }

    default:
      break;
  }
});

client.login(TOKEN);
