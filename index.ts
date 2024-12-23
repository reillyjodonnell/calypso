import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  InteractionType,
  ActionRowBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} from 'discord.js';
import { DUEL_NOT_FOUND, DuelService } from './src/duel/DuelService';
import { DiscordService } from './src/discord/DiscordService';
import { DuelRepository } from './src/duel/DuelRepository';
import {
  duelCommand,
  goldCommand,
  inventoryCommand,
  leaderboardCommand,
} from './src/commands/slashCommands';
import { getAllButtonOptions, parseButtonId } from './src/buttons';
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
import { DuelWinManager } from './src/duel/DuelWinManager';
import { StoreInteractionHandler } from './src/store/StoreInteractionHandler';
import { InventoryRepository } from './src/inventory/InventoryRepository';
import { StoreRepository } from './src/store/StoreRepository';
import { DuelCleanup } from './src/duel/DuelCleanup';
import {
  ItemWithQuantity,
  createInventoryEmbed,
  parseInventoryButtonId,
} from './src/inventory/InventoryEmbed';
import { Weapon } from './src/item/weapon';
import { UserService } from './src/user/UserService';
import { InventoryService } from './src/inventory/InventoryService';
import { WeaponRepository } from './src/weapon/WeaponRepository';
import { createStatsEmbed } from './src/duel/DuelStatsEmbed';
import { LeaderboardRepository } from './src/leaderboard/LeaderboardRepository';
import cron from 'node-cron';
import { LeaderboardApplicationService } from './src/leaderboard/LeaderboardApplicationService';
import { LeaderboardService } from './src/leaderboard/LeaderboardService';
import { getItemsEmbed, parseItemsButtonId } from './src/item/ItemsEmbed';
import { ItemRepository } from './src/item/ItemRepository';
import { ItemDTO } from './src/item/itemDTO';
import { ItemInteractionHandler } from './src/item/ItemInteractionHandler';

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
const goldRepository = new GoldRepository(redisClient);
const goldManager = new GoldManager(goldRepository);

const wagerRepository = new WagerRepository(redisClient);
const wagerManager = new WagerManager(wagerRepository);

const duelRepository = new DuelRepository(redisClient);
const playerRepository = new PlayerRepository(redisClient);
const inventoryRepository = new InventoryRepository(redisClient);
const weaponRepository = new WeaponRepository(redisClient);
const itemRepository = new ItemRepository();

const leaderboardRepository = new LeaderboardRepository(redisClient);

// Clean up
const duelCleanup = new DuelCleanup(
  wagerRepository,
  duelRepository,
  playerRepository
);

const discordService = new DiscordService();
const duelService = new DuelService();
const wagerService = new WagerService(goldManager, wagerManager, duelService);

const storeRepository = new StoreRepository();
const storeInteractionHandler = new StoreInteractionHandler(
  goldRepository,
  inventoryRepository,
  storeRepository,
  itemRepository
);

const userService = new UserService(inventoryRepository, storeRepository);
const inventoryService = new InventoryService(inventoryRepository);

// Leaderboard
const leaderboardService = new LeaderboardService(leaderboardRepository);
const leaderBoardApplicationService = new LeaderboardApplicationService(
  leaderboardService,
  goldManager
);

const duelWinManager = new DuelWinManager(
  duelService,
  wagerService,
  goldManager,
  discordService,
  leaderBoardApplicationService
);

const dualInteractionHandler = new DuelInteractionHandler(
  duelRepository,
  playerRepository,
  duelService,
  discordService,
  duelWinManager,
  duelCleanup,
  inventoryRepository,
  weaponRepository
);

const itemInteractionHandler = new ItemInteractionHandler({
  inventoryRepository,
  discordService,
  duelRepository,
  duelService,
  playerRepository,
  duelWinManager,
  duelCleanup,
});

try {
  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: [duelCommand, goldCommand, inventoryCommand, leaderboardCommand],
  });
} catch (error) {
  console.error(error);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

cron.schedule('0 0 * * *', async () => {
  await leaderBoardApplicationService.processLeaderboardReset(client);
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  // Replace 'YOUR_GUILD_ID' with the actual ID of your guild (server)
  const guild = await discordService.getGuild(client);

  const botMember = guild.members.cache.get(process.env.CALYPSO_ID as string);

  if (
    !botMember?.permissions.has(PermissionFlagsBits.ManageChannels) ||
    !botMember.permissions.has(PermissionFlagsBits.ManageRoles)
  ) {
    console.log(
      'Bot does not have required permissions: Manage Channels and Manage Roles.'
    );
    return;
  }

  // Now pass this channel to your function
  await discordService.createStartHereMessage(guild);
  if (process.env.INIT_SERVER === 'true') {
    const weapons = await storeRepository.getWeapons();
    // const items = await itemRepository.getWeapons();

    await discordService.initializeServer(guild, weapons, items);
  }
  if (process.env.CREATE_STORE_EMBED === 'true') {
    const weapons = await storeRepository.getWeapons();
    // const items = await itemRepository.getWeapons();
    await discordService.createNewStoreEmbed(client, weapons, items);
  }
});

client.on('error', (err) => {
  console.error('client error', err);
});

client.on('interactionCreate', async (interaction) => {
  const discordService = new DiscordService();
  if (!interaction.channelId) throw new Error('interaction.channelId is null');

  if (interaction.type === InteractionType.ModalSubmit) {
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
    console.log('Button');
    if (interaction.customId === 'enter_arena') {
      console.log('ENTER ARENA CALLED!');
      const guild = interaction.guild;

      if (!guild) {
        console.error('No guild found');
        return;
      }
      const member = guild.members.cache.get(interaction.user.id);
      if (!member) {
        console.error('No member found');
        return;
      }

      if (!process.env.START_HERE_MESSAGE_ID) {
        throw new Error('No start here message id found');
      }

      let gladiatorRole = guild.roles.cache.find(
        (role) => role.name === '🛡️ Gladiator'
      );
      if (!gladiatorRole) {
        console.log('Gladiator role not found');
        return;
      }

      // check if they;re already a gladiator
      if (member.roles.cache.has(gladiatorRole.id)) {
        interaction.reply({
          content: 'You are already a gladiator!',
          ephemeral: true,
        });
        return;
      }
      const userId = interaction.user.id;
      try {
        console.log('Adding role to user');
        await member.roles.add(gladiatorRole);
        await userService.initializeUser(userId);
        console.log('User added to role');
        interaction.reply({
          content: 'You are now a gladiator! Welcome to the arena!',
          ephemeral: true,
        });
      } catch (error) {
        console.error(
          `Error adding Gladiator role to ${interaction.user.id}:`,
          error
        );
      }

      return;
    }

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
      case 'stats': {
        // make sure they're saying it from the duel thread
        const duelThread = await discordService.findDuelThread(
          interaction.guild,
          interaction?.channelId
        );
        if (!duelThread) {
          await interaction.reply({
            content: 'This command can only be used in a duel!.',
            ephemeral: true,
          });
          return;
        }

        const player = await playerRepository.getById(
          duelThread.id,
          interaction.user.id
        );
        if (!player) {
          await interaction.reply({
            content: 'Player not found.',
            ephemeral: true,
          });
          return;
        }
        const activeWeapon = await inventoryRepository.getActiveWeapon(
          interaction.user.id
        );
        const weapon = activeWeapon
          ? await weaponRepository.getWeapon(activeWeapon.id)
          : null;

        if (!weapon) {
          await interaction.reply({
            content: 'No weapon found.',
            ephemeral: true,
          });
          return;
        }

        const statsEmbed = createStatsEmbed(
          interaction.user.displayName,
          player,
          weapon
        );

        await interaction.reply({ embeds: [statsEmbed], ephemeral: true });

        break;
      }
      case 'use': {
        // make sure it's their turn
        const duel = await duelRepository.getById(threadId);
        if (!duel) {
          await interaction.reply({
            content: 'Duel not found.',
            ephemeral: true,
          });
          return;
        }
        if (duel.getCurrentTurnPlayerId() !== interaction.user.id) {
          await interaction.reply({
            content: 'It is not your turn.',
            ephemeral: true,
          });
          return;
        }
        // show the users inventory
        const items = await inventoryRepository.getItems(interaction.user.id);
        if (!items) {
          await interaction.reply({
            content: 'No items found.',
            ephemeral: true,
          });
          return;
        }
        if (items.length === 0) {
          await interaction.reply({
            content: 'No items found.',
            ephemeral: true,
          });
          return;
        }
        // fetch each item by their id
        const itemInstances = items.map(async (item) => {
          return await itemRepository.getItemById(item.id);
        });
        const resolved = await Promise.all(itemInstances);
        const itemEmbed = getItemsEmbed({
          items: resolved,
          playerId: interaction.user.id,
        });

        await interaction.reply({
          embeds: [itemEmbed.embed],
          components: [...(itemEmbed.components as any)],
          ephemeral: true,
        });
      }
    }

    if (interaction.customId.startsWith('item')) {
      itemInteractionHandler.handleItem(interaction);
    }

    // inventory
    if (interaction.customId.startsWith('inventory')) {
      const { action, itemId, playerId } = parseInventoryButtonId(
        interaction.customId
      );
      const res = await inventoryRepository.getWeapon(playerId, itemId);
      if (!res) {
        await interaction.reply({
          content: 'Item not found.',
          ephemeral: true,
        });
        return;
      }
      const { id } = res;
      // fetch that weapon by the id
      const fetchedWeapon = await weaponRepository.getWeapon(id);
      if (!fetchedWeapon) {
        await interaction.reply({
          content: 'Item not found.',
          ephemeral: true,
        });
        return;
      }

      const weapons = await inventoryRepository.getWeapons(playerId);
      if (!weapons) {
        await interaction.reply({
          content: 'No weapons found.',
          ephemeral: true,
        });
        return;
      }
      if (fetchedWeapon instanceof Weapon) {
        inventoryService.equipWeapon({ weapons, playerId, weaponId: id });
        await interaction.reply({
          content: `You've equipped the ${fetchedWeapon.getName()}`,
          ephemeral: true,
        });
      }
    }
    if (interaction.customId.startsWith('buy')) {
      // split the id out of it
      const id = interaction.customId.split('_')[1];
      await storeInteractionHandler.handleStorePurchase(interaction, id);
    }
  }

  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'init': {
      break;
    }

    case 'inventory': {
      const weaponIds = await inventoryRepository.getWeapons(
        interaction.user.id
      );
      const itemIds = await inventoryRepository.getItems(interaction.user.id);

      const activeItemId = await inventoryRepository.getActiveWeapon(
        interaction.user.id
      );
      if (!weaponIds || !activeItemId) {
        await interaction.reply({
          content: 'No items found.',
          ephemeral: true,
        });
        return;
      }
      // get each item based on the id
      let items = [];
      if (itemIds) {
        for (const { id, quantity } of itemIds) {
          const item = await itemRepository.getItemById(id);
          if (item) {
            items.push({ ...item, quantity });
          }
        }
      }

      let fetchedWeapons = [];
      for (const { id } of weaponIds) {
        const weapon = await weaponRepository.getWeapon(id);
        if (weapon) {
          fetchedWeapons.push(weapon);
        }
      }
      const equippedWeapon = fetchedWeapons.find(
        (weapon) => weapon.getId() === activeItemId.id
      );

      const res = createInventoryEmbed(
        interaction.user.id,
        fetchedWeapons,
        equippedWeapon,
        items as ItemWithQuantity[]
      );
      if (!res) return;

      await interaction.reply({
        embeds: [res.embed],
        components: [...(res.components as any)],
        ephemeral: true,
      });
      break;
    }

    case 'leaderboard': {
      await leaderBoardApplicationService.replyWithTop10(interaction);
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
