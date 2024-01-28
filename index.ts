import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
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

// persist the users with their record, player info, etc.

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const duelRepository = new DuelRepository();
const playerManager = new PlayerManager();
const duelService = new DuelService(duelRepository, playerManager);
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

      const res = duelService.challengePlayer({
        challengedId: user.id,
        challengerId,
        duelId: duelThread.id,
      });

      if (res.status === DUEL_STARTED) {
        const threadLink = `https://discord.com/channels/${interaction.guild?.id}/${duelThread.id}`;
        await interaction.reply(
          `Duel started! 👀 <@${challengerId}> challenged <@${user.id}> to a duel! Go to this link to check out their duel: ${threadLink}`
        );
        await duelThread.send(
          `<@${challengerId}>, <@${user.id}>, your duel has been set up here. Please use this thread for all duel-related commands and interactions.\n\n<@${user.id}> please use /accept to accept the duel.`
        );
      }

      break;
    }

    case 'accept': {
      console.log(interaction.channelId);
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
        const mentionPlayers = ids?.map((id) => `<@${id}>`).join(' ');
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
        await interaction.reply(
          `${interaction.user.displayName} rolled a ${result} for initiative!\n\nAll players have rolled for initiative.\n\n <@${playerToGoFirst}> it's your turn! Use /attack to begin the attack`
        );
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
