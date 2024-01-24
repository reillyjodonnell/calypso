import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
} from 'discord.js';
import { createAudioPlayer } from '@discordjs/voice';
import { createDuel, getDuelById } from './src/duels';

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const DUEL_CHANNEL_ID = '1199749866339971072';

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
const rollToHitCommand = new SlashCommandBuilder()
  .setName('roll_to_hit')
  .setDescription('Rolls to hit!')
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
      .addChoices({ name: 'd20', value: 'd20' })
  );

const attackCommand = new SlashCommandBuilder()
  .setName('attack')
  .setDescription('Attack another player')
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('The user to attack')
      .setRequired(true)
  );

const healCommand = new SlashCommandBuilder()
  .setName('heal')
  .setDescription('Heal another player')
  .addUserOption((option) =>
    option.setName('user').setDescription('The user to heal').setRequired(true)
  );

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
      rollToHitCommand,
      rollForDamageCommand,
      healCommand,
      attackCommand,
      initiativeCommand,
    ],
  });

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const player = createAudioPlayer();

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
  const channelId = interaction.channelId;
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'ping':
      console.log('ping received. Sending pong');
      await interaction.reply('Pong!');
      break;
    case 'roll': {
      const dice = interaction.options.getString('dice');
      // make sure dice is this type: Dice
      if (!dice) return;
      const sides = parseInt(dice.slice(1));
      const result = roll(sides as Dice).toString();
      await interaction.reply(result);
      break;
    }

    case 'duel': {
      console.log('dueling...');
      const user = interaction.options.getUser('user', true);
      // create duel and add user
      const challengerId = interaction.user.id;
      // add user to duel
      createDuel(DUEL_CHANNEL_ID);

      const manager = getDuelById(DUEL_CHANNEL_ID);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        break;
      }
      manager.addPlayer(challengerId);
      manager.addPlayer(user.id);
      await interaction.reply(`Dueling ${user.username}!`);

      // prompt the other user in the duel channel to accept
      const duelChannel = client.channels.cache.get(DUEL_CHANNEL_ID);
      if (!duelChannel) {
        await interaction.reply(
          'Duel channel not found or is not a text channel.'
        );
        break;
      }
      if (duelChannel.isTextBased()) {
        // Send message in duel channel
        duelChannel.send(
          `<@${user.id}> <@${challengerId}> has challenged you to a duel! Use /accept to accept the challenge.`
        );
      }
      break;
    }

    case 'accept': {
      const duelChannel = client.channels.cache.get(DUEL_CHANNEL_ID);
      const manager = getDuelById(DUEL_CHANNEL_ID);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        break;
      }

      const players = manager.getPlayers();
      const challengerId = players?.filter(
        (player) => player.getId() !== interaction.user.id
      )[0];
      if (!duelChannel) {
        await interaction.reply(
          'Duel channel not found or is not a text channel.'
        );
        break;
      }
      if (duelChannel.isTextBased()) {
        // Send message in duel channel
        duelChannel.send(
          `<@${challengerId}> <@${interaction.user.id}> roll for initiative using /roll d20`
        );
      }
      break;
    }
    case 'initiative': {
      const dice = interaction.options.getString('dice');
      // make sure dice is this type: Dice
      if (!dice) return;
      const sides = parseInt(dice.slice(1));
      const result = roll(sides as Dice).toString();

      // find which player this is
      const manager = getDuelById(DUEL_CHANNEL_ID);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        break;
      }
      const player = manager
        .getPlayers()
        ?.find((player) => player.getId() === interaction.user.id);

      if (!player) return;

      player.setInitiative(parseInt(result));

      // check if everyone has rolled
      const allPlayersRolled = manager.haveAllPlayersRolledForinitiative();

      if (allPlayersRolled) {
        // prompt the specific user to roll for initiative
        const duelChannel = client.channels.cache.get(DUEL_CHANNEL_ID);
        const playerWithHighestInitiative =
          manager.getPlayerWithHighestInitiative();
        // it's that players turn
        playerWithHighestInitiative.startPlayersTurn();
        if (!duelChannel) {
          await interaction.reply(
            'Duel channel not found or is not a text channel.'
          );
          break;
        }
        if (duelChannel.isTextBased()) {
          // Send message in duel channel
          duelChannel.send(
            `<@${playerWithHighestInitiative.getId()}> it's your turn! Take an action!`
          );
        }
      }

      break;
    }

    case 'attack': {
      // is it this players turn?
      const isPlayersTurn =
        getDuelById(DUEL_CHANNEL_ID)?.getCurrentPlayer()?.getId() ===
        interaction.user.id;
      if (!isPlayersTurn) {
        await interaction.reply('It is not your turn, dick!');
        break;
      }

      const duelChannel = client.channels.cache.get(DUEL_CHANNEL_ID);
      const otherPlayerId = interaction.options.getUser('user', true)?.id;
      if (!otherPlayerId) {
        await interaction.reply('You need to specify a user to attack!');
        break;
      }
      // this user needs to roll to hit
      const manager = getDuelById(DUEL_CHANNEL_ID);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        break;
      }

      const player = manager.getPlayer(interaction.user.id);

      if (!player) return;

      player.setTargettingId(otherPlayerId);

      // now prompt the user to roll to hit
      if (!duelChannel) {
        await interaction.reply(
          'Duel channel not found or is not a text channel.'
        );
        break;
      }
      if (duelChannel.isTextBased()) {
        // Send message in duel channel
        duelChannel.send(
          `<@${player.getId()}> roll to hit using /rollToHit d20`
        );
      }
      break;
    }
    case 'roll_to_hit': {
      const manager = getDuelById(DUEL_CHANNEL_ID);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        break;
      }
      if (channelId === DUEL_CHANNEL_ID) {
        // check if it's that players turn
        const player = manager.getPlayer(interaction.user.id);
        if (!player) throw new Error('player not found!');
        const isPlayersTurn = player?.isPlayersTurn();
        if (!isPlayersTurn) {
          await interaction.reply('It is not your turn, dick!');
          break;
        }

        const dice = interaction.options.getString('dice');
        // make sure dice is this type: Dice
        if (!dice) return;
        const sides = parseInt(dice.slice(1));
        const result = roll(sides as Dice).toString();

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
            `You rolled a ${result} and hit! Roll for damage using /damage d6`
          );
        } else {
          // the player missed and their turn is over
          manager.nextPlayersTurn();
          await interaction.reply(
            `You rolled a ${result} and missed :(.\n\n${`<@${manager
              .getCurrentPlayer()
              ?.getId()}> roll to hit using /rollToHit d20`}`
          );
        }
        break;
      }
    }

    case 'roll_for_damage': {
      const manager = getDuelById(DUEL_CHANNEL_ID);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        break;
      }
      if (channelId !== DUEL_CHANNEL_ID) return;
      // check if it's that players turn
      const player = manager.getPlayer(interaction.user.id);
      if (!player) throw new Error('player not found!');
      const isPlayersTurn =
        manager.getCurrentPlayer()?.getId() === player.getId();

      if (!isPlayersTurn) return;

      const dice = interaction.options.getString('dice');
      // make sure dice is this type: Dice
      if (!dice) return;
      const sides = parseInt(dice.slice(1));
      const result = roll(sides as Dice).toString();

      const otherPlayer = manager.getPlayer(player.getTargettingId());

      if (!otherPlayer) return;

      const damage = manager.attackPlayer(otherPlayer, parseInt(result));

      // check if other player is dead
      const isPlayerDead = manager.isPlayerDead(otherPlayer);

      manager.nextPlayersTurn();

      if (isPlayerDead) {
        // the player is dead
        await interaction.reply(
          `You rolled a ${result} and dealt ${damage} damage! <@${otherPlayer.getId()}> is dead!`
        );
      } else {
        // the player is alive
        await interaction.reply(
          `You rolled a ${result} and dealt ${damage} damage! <@${otherPlayer.getId()}> has ${otherPlayer.getHealth()} health left.`
        );
      }
    }

    case 'heal': {
      const manager = getDuelById(DUEL_CHANNEL_ID);
      if (!manager) {
        await interaction.reply('Duel channel not found');
        break;
      }
      if (channelId !== DUEL_CHANNEL_ID) return;

      // check if it's that players turn
      const player = manager.getPlayer(interaction.user.id);
      if (!player) throw new Error('player not found!');

      const isPlayersTurn =
        manager.getCurrentPlayer()?.getId() === player.getId();

      if (!isPlayersTurn) return;

      const target = manager.getPlayer(interaction.user.id);

      if (!target) return;

      const dice = interaction.options.getString('dice');
      // make sure dice is this type: Dice
      if (!dice) return;

      const sides = parseInt(dice.slice(1));

      const result = roll(sides as Dice).toString();

      const heal = manager.healPlayer(target, parseInt(result));

      manager.nextPlayersTurn();

      await interaction.reply(
        `You rolled a ${result} and healed ${heal} health! <@${target.getId()}> has ${target.getHealth()} health left.\n\n${`<@${manager
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
