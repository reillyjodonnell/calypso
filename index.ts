import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
} from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
} from '@discordjs/voice';
import ytdl from 'ytdl-core';

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

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

const rest = new REST({ version: '10' }).setToken(TOKEN);

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: [pingCommand, diceCommand, playCommand, pauseCommand, resumeCommand],
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
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'ping':
      console.log('ping received. Sending pong');
      await interaction.reply('Pong!');
      break;
    case 'roll':
      const dice = interaction.options.getString('dice');
      // make sure dice is this type: Dice
      if (!dice) return;
      const sides = parseInt(dice.slice(1));
      const result = roll(sides as Dice).toString();
      await interaction.reply(result);
      break;
    case 'play':
      try {
        console.log('playing...');
        const url = interaction.options.getString('url', true);
        console.log(interaction.guildId);
        if (!interaction.guildId) return;
        const connection = joinVoiceChannel({
          channelId: interaction.channelId,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild?.voiceAdapterCreator!,
        });
        const stream = ytdl(url, { filter: 'audioandvideo' });
        stream.on('error', console.error);
        const resource = createAudioResource(stream, {
          inputType: StreamType.Arbitrary,
        });

        player.play(resource);
        connection.subscribe(player);
        await interaction.reply('Playing song!');
        break;
      } catch (err) {
        console.log(err);
      }

    case 'pause':
      console.log('pausing...');
      player.pause();
      await interaction.reply('Paused song!');
      break;
    case 'resume':
      console.log('resuming...');
      player.unpause();
      await interaction.reply('Resumed song!');
      break;
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
