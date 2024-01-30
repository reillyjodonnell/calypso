import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  InteractionType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  Collection,
  GuildMember,
} from 'discord.js';
import {
  ALL_PLAYERS_READY,
  ALL_PLAYERS_ROLLED,
  ALREADY_ACCEPTED_DUEL,
  ATTACK_HITS,
  CRITICAL_FAIL,
  CRITICAL_HIT,
  DUEL_ACCEPTED,
  DUEL_NOT_FOUND,
  DUEL_STARTED,
  DUEL_INVALID,
  DuelService,
  NOT_PLAYERS_TURN,
  PLAYER_ALREADY_ROLLED,
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
  goldCommand,
} from './src/commands';
import {
  createAcceptButton,
  createButtonId,
  createRejectButton,
  createRollButton,
  getAllButtonOptions,
  parseButtonId,
} from './src/buttons';
import { DuelAccept } from './src/duel/DuelAccept';
import { getButtonRows, storeEmbed } from './src/store';
import { createClient } from 'redis';
import { GoldRepository } from './src/gold/GoldRepository';
import { RedisClientType } from '@redis/client';
import { GoldManager } from './src/gold/GoldManager';
import { config } from './src/config';

// persist the users with their record, player info, etc.

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const duelRepository = new DuelRepository();
const duelsServicesMap = new Map<
  string,
  { duelService: DuelService; playerManager: PlayerManager }
>();

// this is going to be a map of duel ids to players

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
  redisClient.set('hello', 'world');
  console.log('Redis client connected');
});
await redisClient.connect();

//@ts-ignore
const goldRepository = new GoldRepository(redisClient);
const goldManager = new GoldManager(goldRepository);

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
  const discordService = new DiscordService();
  if (!interaction.channelId) throw new Error('interaction.channelId is null');
  const duelThread = await discordService.findDuelThread(
    interaction.guild,
    interaction?.channelId
  );

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
        await handleAttack(interaction, 'd20', firstSelectedId);
        break;
      case 'heal':
        await handleHeal(interaction, 'd4');
        break;
    }
  }

  if (interaction.isButton()) {
    const { action, guildId, threadId } = parseButtonId(interaction.customId);

    if (!duelThread?.id) {
      throw new Error('duelThread.id is null');
    }
    const res = duelsServicesMap.get(duelThread?.id);

    if (!res) {
      throw new Error('res is null');
    }

    const { duelService } = res;
    const playerIds = duelService.getPlayerIdsInDuel(duelThread?.id);

    if (interaction.guildId !== guildId || interaction.channelId !== threadId) {
      interaction.reply({
        content: 'Wrong thread',
        ephemeral: true,
      });
      return;
    }

    if (!playerIds.includes(interaction.user.id)) {
      interaction.reply({
        content: 'Not your game pal',
        ephemeral: true,
      });
      return;
    }

    // make sure the guild and thread id are the same one

    switch (action) {
      case 'accept': {
        const duelAccept = new DuelAccept(duelsServicesMap);
        const { status, ids, duelThread } = await duelAccept.accept(
          interaction.guild,
          interaction.channelId,
          interaction.user.id
        );
        if (status === 'INVALID_CHANNEL') {
          await interaction.reply({
            content: 'Please use your designated duel thread for this command',
            ephemeral: true,
          });
        }
        if (status === ALREADY_ACCEPTED_DUEL) {
          await interaction.reply({
            content: 'You have already accepted the duel',
            ephemeral: true,
          });
          break;
        }

        if (status === PLAYER_NOT_CHALLENGED) {
          await interaction.reply({
            content: 'You are not the challenged user, dick.',
            ephemeral: true,
          });
          break;
        }

        if (status === DUEL_NOT_FOUND) {
          await interaction.reply(
            'Duel channel not found or is not a text channel.'
          );
          break;
        }

        if (status === PLAYER_NOT_FOUND) {
          await interaction.reply(
            'Quiet now, the match is about to begin! Wait your turn.'
          );
          break;
        }

        if (status === DUEL_ACCEPTED) {
          interaction.reply(`Duel accepted!`);
        }

        if (status === ALL_PLAYERS_READY) {
          const rollForInitativeButton = createRollButton(
            createButtonId({
              guildId: interaction.guildId,
              action: 'initiative',
              threadId: interaction.channelId,
              counter: duelService.getCounter(),
            })
          );

          const row = new ActionRowBuilder().addComponents(
            rollForInitativeButton
          );

          interaction.reply(`All players are now ready!`);
          const mentionPlayers = ids?.map((id: string) => `<@${id}>`).join(' ');
          try {
            await duelThread?.send({
              content: `${mentionPlayers}, roll for initiative using /initiative d20`,
              components: [row as any], // Send the button with the message
            });
          } catch (err) {
            console.error(err);
          }
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
        const res = duelsServicesMap.get(duelThread.id);
        if (!res) throw new Error('res is null');
        const { duelService } = res;

        const dice = 'd20';

        if (!dice) throw new Error('dice is null');

        const { result, status, playerToGoFirst } =
          duelService.rollForInitiative({
            duelId: duelThread.id,
            playerId: interaction.user.id,
            sidedDie: dice,
          });

        console.log(result);

        if (status === PLAYER_ALREADY_ROLLED) {
          await interaction.reply({
            content: "You've already rolled for initiative",
            ephemeral: true,
          });
          break;
        }

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
          break;
        }

        if (status === ALL_PLAYERS_ROLLED) {
          if (!playerToGoFirst) throw new Error('playerToGoFirst is null');

          const row = getAllButtonOptions({
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            userId: playerToGoFirst,
            attackId: duelService.getCounter(),
            healId: duelService.getCounter(),
            leaveId: duelService.getCounter(),
          });
          await interaction.reply({
            content: `${interaction.user.displayName} rolled a ${result} for initiative!\n\nAll players have rolled for initiative.\n\n <@${playerToGoFirst}> it's your turn!`,
            components: [row as any], // Send the button with the message
          });
          break;
        }
        break;
      }

      case 'attack':
      case 'heal':
        await promptForTarget(
          interaction,
          action,
          [interaction.user.id],
          duelService.getCounter()
        );

        break;

      case 'roll_for_damage': {
        await handleRollForDamage({
          interaction,
          defaultDice: 'd6',
        });
        break;
      }

      case 'roll_for_damage_2x': {
        await handleRollForDamage({
          interaction,
          defaultDice: 'd6',
          criticalHit: true,
        });
        break;
      }

      default: {
      }
    }
  }

  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'store': {
      await interaction.reply({
        embeds: [storeEmbed],
        components: [...(getButtonRows() as any)],
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
          createButtonId({
            action: 'accept',
            guildId: interaction.guildId,
            threadId: duelThread.id,
            counter: duelService.getCounter(),
          }),
          false
        );

        const leaveButton = createRejectButton(
          createButtonId({
            action: 'accept',
            guildId: interaction.guildId,
            threadId: duelThread.id,
            counter: duelService.getCounter(),
          }),
          false
        );

        const row = new ActionRowBuilder().addComponents(
          acceptButton,
          leaveButton
        );

        await duelThread.send({
          content: `<@${challengerId}>, <@${user.id}>, your duel has been set up here. Please use this thread for all duel-related commands and interactions.\n\n<@${user.id}> please use /accept to accept the duel or use the buttons below.`,
          components: [row as any], // Send the button with the message
        });
      }
      else if (res.status === DUEL_INVALID) {
        await interaction.reply({
          content: 'You cannot duel yourself!',
          ephemeral: true,
        });
        return;
      }

      break;
    }

    case 'accept': {
      const duelAccept = new DuelAccept(duelsServicesMap);
      const { status, ids, duelThread, count } = await duelAccept.accept(
        interaction.guild,
        interaction.channelId,
        interaction.user.id
      );
      if (status === 'INVALID_CHANNEL') {
        await interaction.reply({
          content: 'Please use your designated duel thread for this command',
          ephemeral: true,
        });
      }
      if (status === ALREADY_ACCEPTED_DUEL) {
        await interaction.reply({
          content: 'You have already accepted the duel',
          ephemeral: true,
        });
        break;
      }

      if (status === PLAYER_NOT_CHALLENGED) {
        await interaction.reply({
          content: 'You are not the challenged user, dick',
          ephemeral: true,
        });
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
        const rollForInitativeButton = createRollButton(
          createButtonId({
            action: 'initative',
            guildId: interaction.guildId,
            threadId: interaction.channelId,
            counter: count,
          }),
          false
        );

        const row = new ActionRowBuilder().addComponents(
          rollForInitativeButton
        );

        interaction.reply(`All players are now ready!`);
        const mentionPlayers = ids?.map((id: string) => `<@${id}>`).join(' ');
        duelThread?.send({
          content: `${mentionPlayers}, roll for initiative using /initiative d20`,
          components: [row as any],
        });
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
      const res = duelsServicesMap.get(duelThread.id);

      if (!res) throw new Error('res is null');

      const { duelService } = res;
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
        const row = getAllButtonOptions({
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          userId: interaction.user.id,
          attackId: duelService.getCounter(),
          healId: duelService.getCounter(),
          leaveId: duelService.getCounter(),
        });
        await interaction.reply({
          content: `${interaction.user.displayName} rolled a ${result} for initiative!\n\nAll players have rolled for initiative.\n\n <@${playerToGoFirst}> it's your turn!`,
          components: [row as any], // Send the button with the message
        });
      }
      break;
    }

    case 'attack': {
      await handleAttack(interaction);
      break;
    }
    case 'roll_for_damage': {
      await handleRollForDamage({ interaction });
      break;
    }

    case 'heal': {
      handleHeal(interaction);
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

async function handleAttack(
  interaction: any,
  defaultDice?: string,
  targetId?: string
) {
  const discordService = new DiscordService();
  const duelThread = await discordService.findDuelThread(
    interaction.guild,
    interaction.channelId
  );

  if (!duelThread || interaction.channelId !== duelThread.id) {
    await interaction.reply(
      'Please use your designated duel thread for this command.'
    );
    return;
  }
  const res = duelsServicesMap.get(duelThread.id);

  if (!res) throw new Error('res is null');

  const { duelService } = res;
  const dice = defaultDice
    ? defaultDice
    : interaction.options.getString('dice');
  const { roll, status, nextPlayer, description, isPlayerDead } =
    duelService.attemptToHit({
      duelId: duelThread.id,
      attackerId: interaction.user.id,
      defenderId: targetId
        ? targetId
        : interaction.options.getUser('user', true)?.id,
      sidedDie: dice,
    });

  if (status === 'NOT_ATTACKERS_TURN') {
    await interaction.reply("It's not your turn!");
    return;
  }

  if (status === CRITICAL_HIT) {
    const rollButton = createRollButton(
      createButtonId({
        action: 'roll_for_damage_2x',
        guildId: interaction.guildId,
        threadId: interaction.channelId,
        counter: duelService.getCounter(),
      }),
      false
    );
    const row = new ActionRowBuilder().addComponents(rollButton);
    await interaction.reply({
      content: `You rolled a ${roll}. Critical hit! Damage is doubled. Roll for damage using /roll_for_damage 2d6`,
      components: [row as any],
    });
    return;
  }

  if (status === CRITICAL_FAIL) {
    const row = getAllButtonOptions({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      attackId: duelService.getCounter(),
      healId: duelService.getCounter(),
      leaveId: duelService.getCounter(),
    });

    if (isPlayerDead) {
      // end game
      await interaction.reply({
        content: `${description}\n\n<@${nextPlayer?.getId()}> wins!`,
        components: [row as any],
      });
      await duelThread.setLocked(true);
      if (!nextPlayer) throw new Error('nextPlayer is null');
      await goldManager.awardGold(
        nextPlayer?.getId(),
        config.amountOfGoldForWin
      );
    }

    await interaction.reply({
      content: `${description}\n\n<@${nextPlayer?.getId()}> it's your turn! Use /attack to begin the attack`,
      components: [row as any],
    });

    return;
  }

  if (status === ATTACK_HITS) {
    const rollButton = createRollButton(
      createButtonId({
        action: 'roll_for_damage',
        guildId: interaction.guildId,
        threadId: interaction.channelId,
        counter: duelService.getCounter(),
      }),
      false
    );
    const row = new ActionRowBuilder().addComponents(rollButton);
    await interaction.reply({
      content: `You rolled a ${roll} and hit! Roll for damage using /roll_for_damage d6`,
      components: [row as any],
    });
    return;
  }
  const row = getAllButtonOptions({
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    userId: interaction.user.id,
    attackId: duelService.getCounter(),
    healId: duelService.getCounter(),
    leaveId: duelService.getCounter(),
  });

  await interaction.reply({
    content: `You rolled a ${roll} and missed! :(\n\n<@${nextPlayer?.getId()}> it's your turn! Use /attack to begin the attack`,
    components: [row as any],
  });
}

async function handleRollForDamage({
  interaction,
  defaultDice,
  criticalHit = false,
}: {
  interaction: any;
  defaultDice?: string;
  criticalHit?: boolean;
}) {
  const discordService = new DiscordService();
  const duelThread = await discordService.findDuelThread(
    interaction.guild,
    interaction.channelId
  );

  if (!duelThread || interaction.channelId !== duelThread.id) {
    await interaction.reply(
      'Please use your designated duel thread for this command.'
    );
    return;
  }

  const res = duelsServicesMap.get(duelThread.id);

  if (!res) throw new Error('res is null');

  const { duelService } = res;

  const dice = defaultDice
    ? defaultDice
    : interaction.options.getString('dice');
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
    criticalHit,
  });

  if (status === 'NOT_ATTACKERS_TURN') {
    await interaction.reply("It's not your turn!");
    return;
  }
  if (status === 'TARGET_HIT') {
    const row = getAllButtonOptions({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      attackId: duelService.getCounter(),
      healId: duelService.getCounter(),
      leaveId: duelService.getCounter(),
    });
    await interaction.reply({
      content: `You rolled a ${roll} and dealt ${roll} damage! <@${targetId}> has ${targetHealthRemaining} health left.\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack or /heal to heal yourself`,
      components: [row as any],
    });

    return;
  }
  if (status === 'TARGET_DEAD' && !winnerId) {
    const row = getAllButtonOptions({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      attackId: duelService.getCounter(),
      healId: duelService.getCounter(),
      leaveId: duelService.getCounter(),
    });
    await interaction.reply({
      content: `You dealt ${roll} damage. You see the light leave their eyes. You killed <@${targetId}>!\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack or /heal to heal yourself`,
      components: [row as any],
    });
    return;
  }
  if (status === 'TARGET_DEAD' && winnerId) {
    await interaction.reply(
      `You dealt ${roll} damage. You see the light leave their eyes. You killed <@${targetId}>! <@${winnerId}> wins!`
    );
    // lock the thread bc the game is over
    await duelThread.setLocked(true);
    await goldManager.awardGold(winnerId, config.amountOfGoldForWin);
    return;
  }
}

async function handleHeal(interaction: any, defaultDice?: string) {
  const discordService = new DiscordService();
  const duelThread = await discordService.findDuelThread(
    interaction.guild,
    interaction.channelId
  );

  if (!duelThread || interaction.channelId !== duelThread.id) {
    await interaction.reply(
      'Please use your designated duel thread for this command.'
    );
    return;
  }

  const res = duelsServicesMap.get(duelThread.id);

  if (!res) throw new Error('res is null');

  const { duelService } = res;

  const dice = defaultDice
    ? defaultDice
    : interaction.options.getString('dice');
  const { status, healthRemaining, roll, nextPlayerId } =
    duelService.healingRoll({
      duelId: duelThread.id,
      playerId: interaction.user.id,
      sidedDie: dice,
    });
  if (status === 'NOT_PLAYERS_TURN') {
    await interaction.reply({
      content: "It's not your turn!",
      ephemeral: true,
    });
    return;
  }
  if (status === 'NO_MORE_POTIONS') {
    await interaction.reply(
      'You have no more potions left! Choose a different action.'
    );
    return;
  }
  if (status === 'PLAYER_HEALED') {
    const row = getAllButtonOptions({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      attackId: duelService.getCounter(),
      healId: duelService.getCounter(),
      leaveId: duelService.getCounter(),
    });

    await interaction.reply({
      content: `You rolled a ${roll} and healed ${roll} health! You have ${healthRemaining} health left.\n\n<@${nextPlayerId}> it's your turn! Use /attack to begin the attack or /heal to heal yourself`,
      components: [row as any],
    });
  }
}

async function promptForTarget(
  interaction: any,
  action: string,
  duelParticipants: string[],
  counter: number
) {
  if (!interaction.guildId) throw new Error('interaction.guildId is null');
  if (!interaction.channelId) throw new Error('interaction.channelId is null');
  if (!interaction.user.id) throw new Error('interaction.user.id is null');

  const discordService = new DiscordService();

  const duelThread = await discordService.findDuelThread(
    interaction.guild,
    interaction.channelId
  );

  if (!duelThread || interaction.channelId !== duelThread.id) {
    await interaction.reply(
      'Please use your designated duel thread for this command.'
    );
    return;
  }

  const res = duelsServicesMap.get(duelThread.id);

  if (!res) throw new Error('res is null');

  const { duelService } = res;

  // Filter members to include only duel participants
  const members: Collection<string, GuildMember> | undefined =
    interaction.guild.members.cache.filter(
      (member: any) =>
        !member.user.bot && duelParticipants.includes(member.user.id)
    );

  if (members?.size === 0) {
    // Handle the case where there are no duel participants
    await interaction.reply('No participants found in the duel.');
    return;
  }

  const { status, targets } = duelService.declareAttack({
    duelId: duelThread.id,
    playerId: interaction.user.id,
  });

  if (status === NOT_PLAYERS_TURN) {
    await interaction.reply({
      content: "It's not your turn!",
      ephemeral: true,
    });
    return;
  }

  // Create options for the select menu
  const options = targets?.map((target) => {
    const id = target.getId();
    const targetMember = interaction.guild.members.cache.get(id); // Retrieve the member object from the cache

    if (!targetMember) {
      console.error(`Member with ID ${id} not found.`);
      return null; // Or handle this case as you see fit
    }

    const displayName = targetMember.displayName; // Get the display name
    if (!displayName) throw new Error('displayName is null');
    return new StringSelectMenuOptionBuilder()
      .setLabel(displayName)
      .setValue(id);
  });

  if (!options) throw new Error('options is null');

  const selectMenu =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(
          createButtonId({
            action,
            guildId: interaction.guildId,
            threadId: interaction.channelId,
            counter,
          })
        )
        .setPlaceholder('Select a target')
        .addOptions(...(options as StringSelectMenuOptionBuilder[]))
    );

  // Send the reply
  try {
    await interaction.reply({
      content: 'Choose your target:',
      components: [selectMenu],
      ephemeral: true,
    });
  } catch (err) {
    console.error(err);
  }
}
