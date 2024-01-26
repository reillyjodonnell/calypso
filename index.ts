import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ChannelType,
} from 'discord.js';
import { createAudioPlayer } from '@discordjs/voice';
import { createDuel, getDuelById } from './src/duels';

// persist the users with their record, player info, etc.

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const DUEL_CHANNEL_NAME = 'duel';

const duels = new Map<string, { challenger: string; challenged: string }>();

// this is going to be a map of duel ids to players

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing TOKEN or CLIENT_ID');
  process.exit(1);
}

const pingCommand = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!');

const diceCommand = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Rolls a dice')
  .addStringOption((option) =>
    option
      .setName('dice')
      .setDescription('The dice to roll')
      .setRequired(true)
      .addChoices(
        { name: 'd4', value: 'd4' },
        { name: 'd6', value: 'd6' },
        { name: 'd8', value: 'd8' },
        { name: 'd10', value: 'd10' },
        { name: 'd12', value: 'd12' },
        { name: 'd20', value: 'd20' },
        { name: 'd100', value: 'd100' }
      )
  );
const playCommand = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Plays a song from YouTube')
  .addStringOption((option) =>
    option
      .setName('url')
      .setDescription('The URL of the YouTube video to play')
      .setRequired(true)
  );

const pauseCommand = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Pauses the current song');

const resumeCommand = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Resumes the current song');

const duelCommand = new SlashCommandBuilder()
  .setName('duel')
  .setDescription('Duel another user')
  .addUserOption((option) =>
    option.setName('user').setDescription('The user to duel').setRequired(true)
  );
const acceptCommand = new SlashCommandBuilder()
  .setName('accept')
  .setDescription('Accept a duel challenge');

const initiativeCommand = new SlashCommandBuilder()
  .setName('initiative')
  .setDescription('Roll for initiative!')
  .addStringOption((option) =>
    option
      .setName('dice')
      .setDescription('The dice to roll')
      .setRequired(true)
      .addChoices({ name: 'd20', value: 'd20' })
  );

const rollForDamageCommand = new SlashCommandBuilder()
  .setName('roll_for_damage')
  .setDescription('Rolls for damage!')
  .addStringOption((option) =>
    option
      .setName('dice')
      .setDescription('The dice to roll')
      .setRequired(true)
      .addChoices({ name: 'd6', value: 'd6' })
  );

const attackCommand = new SlashCommandBuilder()
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

const healCommand = new SlashCommandBuilder()
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

const statsCommand = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('View your stats');

const rest = new REST({ version: '10' }).setToken(TOKEN);

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: [
      pingCommand,
      diceCommand,
      playCommand,
      pauseCommand,
      resumeCommand,
      duelCommand,
      acceptCommand,
      rollForDamageCommand,
      healCommand,
      attackCommand,
      initiativeCommand,
      statsCommand,
    ],
  });

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
  const channelId = interaction.channelId;

  // get the map
  // Iterate over the entries
  for (const [key, value] of duels.entries()) {
    console.log(key, value);
  }
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'ping':
      console.log('ping received. Sending pong');
      await interaction.reply('Pong!');
      break;
    case 'stats': {
      // retrieve that players stats from the db
      const userId = interaction.user?.id;
      if (!userId) return;
      interaction.reply('Stats coming soon!');
      break;
    }
    case 'roll': {
      const dice = interaction.options.getString('dice');
      const result = parseDieAndRoll(dice);
      await interaction.reply(result);
      break;
    }

    case 'duel': {
      // look for duel channel
      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply('This command can only be used in a server.');
        return;
      }
      let duelChannel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === DUEL_CHANNEL_NAME && channel.isTextBased()
      );

      // Create new channel if it doesn't exist
      if (!duelChannel) {
        duelChannel = await guild.channels.create({
          name: DUEL_CHANNEL_NAME,
          type: ChannelType.GuildText,
          reason: 'Needed a channel for duels',
        });
      }

      const user = interaction.options.getUser('user', true);
      // create duel and add user
      const challengerId = interaction.user.id;
      // add user to duel
      createDuel(duelChannel.id);

      const manager = getDuelById(duelChannel.id);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        break;
      }
      manager.addPlayer(challengerId);
      manager.addPlayer(user.id);
      await interaction.reply(`Dueling ${user.username}!`);

      duels.set(duelChannel.id, {
        challenger: challengerId,
        challenged: user.id,
      });

      if (duelChannel.isTextBased()) {
        // Send message in duel channel
        duelChannel.send({
          content: `<@${user.id}> <@${challengerId}> has challenged you to a duel! Use /accept to accept the challenge.`,
        });
      }
      break;
    }

    case 'accept': {
      console.log("looking for channel named 'duel-channel'...");
      const duelChannel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === DUEL_CHANNEL_NAME && channel.isTextBased()
      );
      if (!duelChannel) return;
      console.log('duel channel found!');
      const manager = getDuelById(duelChannel.id);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        break;
      }

      // check if it's the cahllenged user
      const isChallengedUser =
        duels.get(duelChannel.id)?.challenged === interaction.user.id;

      if (!isChallengedUser) {
        await interaction.reply('You are not the challenged user, dick.');
        break;
      }

      const players = manager.getPlayers();
      const challengerId = players
        ?.filter((player) => player.getId() !== interaction.user.id)[0]
        .getId();

      // make sure the person who accepted is the challenged

      console.log('challengerId: ', challengerId);

      if (!challengerId) {
        await interaction.reply('Challenger not found');
        break;
      }
      if (!duelChannel) {
        await interaction.reply(
          'Duel channel not found or is not a text channel.'
        );
        break;
      }
      interaction.reply(`Duel accepted!`);
      if (duelChannel.isTextBased()) {
        // Send message in duel channel
        duelChannel.send(
          `<@${challengerId}> <@${interaction.user.id}> roll for initiative using /initiative d20`
        );
      }
      break;
    }
    case 'initiative': {
      const duelChannel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === DUEL_CHANNEL_NAME && channel.isTextBased()
      );
      if (!duelChannel) return;
      const dice = interaction.options.getString('dice');
      const result = parseDieAndRoll(dice);

      // find which player this is
      const manager = getDuelById(duelChannel.id);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        break;
      }

      manager.setPlayerInitiative(interaction.user.id, parseInt(result));

      // check if everyone has rolled
      const allPlayersRolled = manager.haveAllPlayersRolledForinitiative();
      console.log('allPlayersRolled: ', allPlayersRolled);

      if (!allPlayersRolled) {
        await interaction.reply(
          `${interaction.user.displayName} rolled a ${result} for initiative! 
              Waiting for other players to roll for initiative.`
        );
      }

      if (allPlayersRolled) {
        manager.setTurnOrder();
        // prompt the specific user to roll for initiative
        const playerWithHighestInitiative =
          manager.getPlayerWithHighestInitiative();
        // it's that players turn
        playerWithHighestInitiative.startPlayersTurn();
        if (!duelChannel) {
          console.error("Duel channel doesn't exist");
          break;
        }
        if (duelChannel.isTextBased()) {
          // Send message in duel channel
          duelChannel.send(
            `<@${playerWithHighestInitiative.getId()}> it's your turn! Take an action! Commands are /attack or /heal`
          );
        }
      }

      break;
    }

    case 'attack': {
      const duelChannel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === DUEL_CHANNEL_NAME && channel.isTextBased()
      );

      if (!duelChannel) return;
      const manager = getDuelById(duelChannel.id);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        return;
      }
      // is it this players turn?
      const isPlayersTurn =
        manager.getCurrentPlayer()?.getId() === interaction.user.id;
      if (!isPlayersTurn) return;

      const otherPlayerId = interaction.options.getUser('user', true)?.id;
      if (!otherPlayerId) {
        await interaction.reply('You need to specify a user to attack!');
        return;
      }
      // this user needs to roll to hit

      const player = manager.getPlayer(interaction.user.id);

      if (!player) return;

      player.setTargettingId(otherPlayerId);

      // now prompt the user to roll to hit
      if (!duelChannel) {
        await interaction.reply(
          'Duel channel not found or is not a text channel.'
        );
        return;
      }

      if (channelId === duelChannel.id) {
        // check if it's that players turn
        const player = manager.getPlayer(interaction.user.id);
        if (!player) throw new Error('player not found!');
        const isPlayersTurn = player?.isPlayersTurn();
        if (!isPlayersTurn) return;

        const dice = interaction.options.getString('dice');
        const result = parseDieAndRoll(dice);
        const otherPlayer = manager.getPlayer(interaction.user.id);

        if (!otherPlayer) return;

        // check if roll to hit
        const doesItHit = manager.doesAttackHitPlayer(
          otherPlayer,
          parseInt(result)
        );

        if (doesItHit) {
          // the player hit and needs to roll for damage
          await interaction.reply(
            `You rolled a ${result} and hit! Roll for damage using /roll_for_damage d6`
          );
          return;
        } else {
          manager.nextPlayersTurn();
          // the player missed and their turn is over

          await interaction.reply(
            `You rolled a ${result} and missed :(.\n\n<@${manager
              .getCurrentPlayer()
              ?.getId()}> it's your turn!`
          );
          return;
        }
      }
    }

    case 'roll_for_damage': {
      console.log('roll_for_damage');
      const duelChannel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === DUEL_CHANNEL_NAME && channel.isTextBased()
      );

      if (!duelChannel) return;
      console.log('we have the duel channel');
      const manager = getDuelById(duelChannel.id);
      if (!manager) {
        console.log('no manager');
        await interaction.reply('Duel channel not found');
        break;
      }
      const player = manager.getPlayer(interaction.user.id);
      if (!player) throw new Error('player not found!');
      const isPlayersTurn = player?.isPlayersTurn();
      if (!isPlayersTurn) return;

      console.log('is players turn');
      if (channelId !== duelChannel.id) return;
      // check if it's that players turn

      const dice = interaction.options.getString('dice');
      // make sure dice is this type: Dice
      const result = parseDieAndRoll(dice);

      const otherPlayer = manager.getPlayer(player.getTargettingId());

      if (!otherPlayer) return;

      manager.attackPlayer(otherPlayer, parseInt(result));

      // check if other player is dead
      const isPlayerDead = manager.isPlayerDead(otherPlayer);
      console.log('Is player dead: ', isPlayerDead);

      if (isPlayerDead) {
        // the player is dead
        await interaction.reply(
          `You rolled a ${result} and dealt ${result} damage! <@${otherPlayer.getId()}> is dead! <@${manager
            .getCurrentPlayer()
            ?.getId()}> wins!`
        );
        return;
      } else {
        manager.nextPlayersTurn();
        // the player is alive
        interaction.reply(
          `You rolled a ${result} and dealt ${result} damage! <@${otherPlayer.getId()}> has ${otherPlayer.getHealth()} health left.\n\n<@${manager
            .getCurrentPlayer()
            ?.getId()}> it's your turn!`
        );
        return;
      }
    }

    case 'heal': {
      const duelChannel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === DUEL_CHANNEL_NAME && channel.isTextBased()
      );
      if (!duelChannel) return;
      const manager = getDuelById(duelChannel.id);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        break;
      }
      console.log("looking for channel named 'duel-channel'...");
      if (channelId !== duelChannel.id) return;

      // check if it's that players turn
      const player = manager.getPlayer(interaction.user.id);
      if (!player) throw new Error('player not found!');

      const isPlayersTurn =
        manager.getCurrentPlayer()?.getId() === player.getId();

      if (!isPlayersTurn) {
        console.log("It's not this players turn");
        const currentPlayerId = manager.getCurrentPlayer()?.getId();
        console.log('currentPlayerId: ', currentPlayerId);
        return;
      }
      console.log("it's this players turn");

      const target = manager.getPlayer(interaction.user.id);

      if (!target) return;
      console.log('target: ', target);

      const dice = interaction.options.getString('dice');
      // make sure dice is this type: Dice
      const result = parseDieAndRoll(dice);

      const heal = manager.healPlayer(target, parseInt(result));

      manager.nextPlayersTurn();

      await interaction.reply(
        `You rolled a ${result} and healed ${result} health! <@${target.getId()}> has ${target.getHealth()} health left.\n\n${`<@${manager
          .getCurrentPlayer()
          ?.getId()}> it's your turn! Take an action!`}`
      );
    }

    default:
      console.log('Unknown command');
      break;
  }
});

// This represents all the types of dice we can roll
type Dice = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export function roll(dice: Dice) {
  return Math.floor(Math.random() * dice) + 1;
}

client.login(TOKEN);

function parseDieAndRoll(die: string | null) {
  if (!die) throw new Error('die is null');

  const sides = parseInt(die.slice(1));
  const result = roll(sides as Dice).toString();
  return result;
}
