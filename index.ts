import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  InteractionType,
  ActionRowBuilder,
} from 'discord.js';
import {
  ALL_PLAYERS_READY,
  ALL_PLAYERS_ROLLED,
  ALREADY_ACCEPTED_DUEL,
  ATTACK_HITS,
  DUEL_ACCEPTED,
  DUEL_NOT_FOUND,
  DUEL_STARTED,
  DuelService,
  PLAYER_NOT_CHALLENGED,
  PLAYER_NOT_FOUND,
  PLAYER_ROLLED,
} from './src/duel/DuelService';
import { DiscordService } from './src/discord/DiscordService';
import { DuelRepository } from './src/duel/DuelRepository';
import { PlayerManager } from './src/player/player';
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
} from './src/commands';
import {
  createAcceptButton,
  createAttackButton,
  createHealButton,
  createInventoryButton,
  createRejectButton,
} from './src/buttons';

// persist the users with their record, player info, etc.

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const duelRepository = new DuelRepository();
const duelsServicesMap = new Map();

// this is going to be a map of duel ids to players

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing TOKEN or CLIENT_ID');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

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
    ],
  });
} catch (error) {
  console.error(error);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
  const channelId = interaction.channelId;

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

  if (interaction.isButton()) {
    // id of button
    console.log(interaction.customId);
    // channel id
    console.log(interaction.guildId);
    // thread id
    console.log(interaction.channelId);
    console.log(interaction.member?.user.id);
    console.log(interaction.member?.user.username);
  }

  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'test': {
      const attackButton = createAttackButton(interaction.user.id === '1');
      const healButton = createHealButton(interaction.user.id === '2');
      const inventoryButton = createInventoryButton(false);
      const row = new ActionRowBuilder().addComponents(
        attackButton
        // healButton,
        // leaveButton,
        // inventoryButton
      );

      await interaction.reply({
        content: `${interaction.user.displayName} 14 hits!\n\nRoll for damage!`,
        components: [row as any], // Send the button with the message
      });
      break;
    }
    case 'store': {
      const storeEmbed = new EmbedBuilder()
        .setColor(0x0099ff) // Hex color
        .setTitle('🏛️ Ares Armory 🏛️')
        .setDescription(
          'Welcome to the armory of the gods! Here are the items available for purchase:'
        )
        .addFields(
          { name: '\u200B', value: '\u200B' }, // Blank field for spacing

          {
            name: '🔮 Featured Items (resets in 00:12:32)',
            value:
              'Items bestowed with divine powers, available for a limited time.',
          },
          {
            name: 'Elixir of Ares',
            value: 'Heals 2d4 health points. Price: 100 gold',
            inline: true,
          },
          {
            name: 'Cloak of Shadows',
            value: 'Grants temporary invisibility. Price: 150 gold',
            inline: true,
          },
          {
            name: 'Ring of Fortitude',
            value: 'Temporary immunity to first attack. Price: 120 gold',
            inline: true,
          },
          { name: '\u200B', value: '\u200B' }, // Blank field for spacing
          { name: '🛡️ Basic Items', value: 'Essential items for any warrior.' },
          {
            name: 'Sword',
            value: 'Increases attack power. Price: 50 gold',
            inline: true,
          },
          {
            name: 'Shield',
            value: 'Boosts defense. Price: 40 gold',
            inline: true,
          },
          {
            name: 'Armor',
            value: 'Provides superior protection. +1 ac Price: 60 gold',
            inline: true,
          },
          {
            name: 'Regular Potion',
            value: 'Heals 1d4 health points. Price: 20 gold',
            inline: true,
          }
        )
        .setFooter({ text: 'Use /buy [item_name] to purchase an item.' });

      await interaction.reply({ embeds: [storeEmbed] });
      break;
    }
    case 'buy': {
      console.log('Buy called');
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
    case 'roll': {
      const dice = interaction.options.getString('dice');
      const result = parseDieAndRoll(dice);
      await interaction.reply(result.toString());
      break;
    }

    case 'duel': {
      const user = interaction.options.getUser('user', true);
      const challengerId = interaction.user.id;
      const discordService = new DiscordService();
      const duelThread = await discordService.createDuelThread({
        challengedId: user.id,
        challengerId,
        guild: interaction.guild,
      });
      // Create new instances for the duel
      const playerManager = new PlayerManager();
      const duelService = new DuelService(duelRepository, playerManager);

      // Store the instances in the map
      duelsServicesMap.set(duelThread.id, { duelService, playerManager });

      const res = duelService.challengePlayer({
        challengedId: user.id,
        challengerId,
        duelId: duelThread.id,
      });

      if (res.status === DUEL_STARTED) {
        const threadLink = `https://discord.com/channels/${interaction.guild?.id}/${duelThread.id}`;
        await interaction.reply(
          `Duel started! 👀 <@${challengerId}> challenged <@${user.id}> to a duel!\n\nGo to this link to check out their duel: ${threadLink}`
        );
        // create button
        const acceptButton = createAcceptButton(
          `${interaction.guild?.id}/${duelThread.id}/${user.id}/accept`,
          false
        );
        const leaveButton = createRejectButton(
          `${interaction.guild?.id}/${duelThread.id}/${user.id}/reject`,
          false
        );

        const row = new ActionRowBuilder().addComponents(
          acceptButton,
          leaveButton
        );

        await duelThread.send({
          content: `<@${challengerId}>, <@${user.id}>, your duel has been set up here. Please use this thread for all duel-related commands and interactions.\n\n<@${user.id}> please use /accept to accept the duel.`,
          components: [row as any], // Send the button with the message
        });
      }

      break;
    }

    case 'accept': {
      const discordService = new DiscordService();
      const duelThread = await discordService.findDuelThread(
        interaction.guild,
        interaction.channelId
      );

      if (!duelThread || interaction.channelId !== duelThread.id) {
        await interaction.reply(
          'Please use your designated duel thread for this command.'
        );
        break;
      }
      const { duelService } = duelsServicesMap.get(duelThread.id);

      const { status, ids } = duelService.acceptDuel({
        challengedId: interaction.user.id,
        duelId: duelThread.id,
      });
      if (status === ALREADY_ACCEPTED_DUEL) {
        await interaction.reply('You have already accepted the duel');
        break;
      }

      if (status === PLAYER_NOT_CHALLENGED) {
        await interaction.reply('You are not the challenged user, dick.');
        break;
      }

      if (status === DUEL_NOT_FOUND) {
        await interaction.reply(
          'Duel channel not found or is not a text channel.'
        );
        break;
      }

      if (status === PLAYER_NOT_FOUND) {
        // some dick is trying to talk. Only players in thread can talk though
      }

      if (status === DUEL_ACCEPTED) {
        interaction.reply(`Duel accepted!`);
      }

      if (status === ALL_PLAYERS_READY) {
        interaction.reply(`All players are now ready!`);
        const mentionPlayers = ids?.map((id: string) => `<@${id}>`).join(' ');
        duelThread.send(
          `${mentionPlayers}, roll for initiative using /initiative d20`
        );
      }

      break;
    }
    case 'initiative': {
      const discordService = new DiscordService();
      const duelThread = await discordService.findDuelThread(
        interaction.guild,
        interaction.channelId
      );

      if (!duelThread || interaction.channelId !== duelThread.id) {
        await interaction.reply(
          'Please use your designated duel thread for this command.'
        );
        break;
      }
      const { duelService } = duelsServicesMap.get(duelThread.id);

      const dice = interaction.options.getString('dice');

      if (!dice) throw new Error('dice is null');

      const { result, status, playerToGoFirst } = duelService.rollForInitiative(
        {
          duelId: duelThread.id,
          playerId: interaction.user.id,
          sidedDie: dice,
        }
      );

      if (status === DUEL_NOT_FOUND) {
        await interaction.reply(
          'Duel channel not found or is not a text channel.'
        );
        break;
      }

      if (status === PLAYER_ROLLED) {
        await interaction.reply(
          `${interaction.user.displayName} rolled a ${result} for initiative!\nWaiting for other players to roll for initiative.`
        );
      }

      if (status === ALL_PLAYERS_ROLLED) {
        const attackButton = createAttackButton(
          interaction.user.id === playerToGoFirst
        );
        const healButton = createHealButton(
          interaction.user.id === playerToGoFirst
        );
        const leaveButton = createHealButton(
          interaction.user.id === playerToGoFirst
        );
        const row = new ActionRowBuilder().addComponents(
          attackButton,
          healButton,
          leaveButton
        );

        await interaction.reply({
          content: `${interaction.user.displayName} rolled a ${result} for initiative!\n\nAll players have rolled for initiative.\n\n <@${playerToGoFirst}> it's your turn!`,
          components: [row as any], // Send the button with the message
        });
      }
      break;
    }

    case 'attack': {
      const discordService = new DiscordService();
      const duelThread = await discordService.findDuelThread(
        interaction.guild,
        interaction.channelId
      );

      if (!duelThread || interaction.channelId !== duelThread.id) {
        await interaction.reply(
          'Please use your designated duel thread for this command.'
        );
        break;
      }
      const { duelService } = duelsServicesMap.get(duelThread.id);

      const dice = interaction.options.getString('dice');
      const { roll, status, nextPlayer } = duelService.attemptToHit({
        duelId: duelThread.id,
        attackerId: interaction.user.id,
        defenderId: interaction.options.getUser('user', true)?.id,
        sidedDie: dice,
      });

      if (status === 'NOT_ATTACKERS_TURN') {
        await interaction.reply("It's not your turn!");
        break;
      }

      if (status === ATTACK_HITS) {
        await interaction.reply(
          `You rolled a ${roll} and hit! Roll for damage using /roll_for_damage d6`
        );
        break;
      }
      await interaction.reply(
        `You rolled a ${roll} and missed! :(\n\n<@${nextPlayer?.getId()}> it's your turn! Use /attack to begin the attack`
      );
      break;
    }
    case 'roll_for_damage': {
      const discordService = new DiscordService();
      const duelThread = await discordService.findDuelThread(
        interaction.guild,
        interaction.channelId
      );

      if (!duelThread || interaction.channelId !== duelThread.id) {
        await interaction.reply(
          'Please use your designated duel thread for this command.'
        );
        break;
      }

      const { duelService } = duelsServicesMap.get(duelThread.id);

      const dice = interaction.options.getString('dice');
      const {
        status,
        roll,
        targetHealthRemaining,
        targetId,
        winnerId,
        nextPlayerId,
      } = duelService.rollFordamage({
        duelId: duelThread.id,
        attackerId: interaction.user.id,
        sidedDie: dice,
      });

      if (status === 'NOT_ATTACKERS_TURN') {
        await interaction.reply("It's not your turn!");
        break;
      }
      if (status === 'TARGET_HIT') {
        await interaction.reply(
          `You rolled a ${roll} and dealt ${roll} damage! <@${targetId}> has ${targetHealthRemaining} health left.\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack or /heal to heal yourself`
        );
        break;
      }
      if (status === 'TARGET_DEAD' && !winnerId) {
        await interaction.reply(
          `You dealt ${roll} damage. You see the light leave their eyes. You killed <@${targetId}>!`
        );
        break;
      }
      if (status === 'TARGET_DEAD' && winnerId) {
        await interaction.reply(
          `You dealt ${roll} damage. You see the light leave their eyes. You killed <@${targetId}>! <@${winnerId}> wins!`
        );
        // lock the thread bc the game is over
        await duelThread.setLocked(true);
        break;
      }

      break;
    }

    case 'heal': {
      const discordService = new DiscordService();
      const duelThread = await discordService.findDuelThread(
        interaction.guild,
        interaction.channelId
      );

      if (!duelThread || interaction.channelId !== duelThread.id) {
        await interaction.reply(
          'Please use your designated duel thread for this command.'
        );
        break;
      }

      const { duelService } = duelsServicesMap.get(duelThread.id);

      const dice = interaction.options.getString('dice');
      const { status, healthRemaining, roll, nextPlayerId } =
        duelService.healingRoll({
          duelId: duelThread.id,
          playerId: interaction.user.id,
          sidedDie: dice,
        });
      if (status === 'NOT_PLAYERS_TURN') {
        await interaction.reply("It's not your turn!");
        break;
      }
      if (status === 'NO_MORE_POTIONS') {
        await interaction.reply(
          'You have no more potions left! Choose a different action.'
        );
        break;
      }
      if (status === 'PLAYER_HEALED') {
        await interaction.reply(
          `You rolled a ${roll} and healed ${roll} health! You have ${healthRemaining} health left.\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack or /heal to heal yourself`
        );
      }
      break;
    }

    default:
      console.log('Unknown command');
      break;
  }
});

// This represents all the types of dice we can roll
type DieTypes = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export function roll(typeOfDie: DieTypes) {
  return Math.floor(Math.random() * typeOfDie) + 1;
}

client.login(TOKEN);

export function parseDieAndRoll(die: string | null) {
  if (!die) throw new Error('die is null');

  const sides = parseInt(die.slice(1));
  const result = roll(sides as DieTypes);
  return result;
}
